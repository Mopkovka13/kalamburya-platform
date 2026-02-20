package ru.mopkovka.oauth2;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import ru.mopkovka.auth.AuthCodeStore;
import ru.mopkovka.auth.JwtService;
import ru.mopkovka.common.UserAuthenticatedEvent;
import ru.mopkovka.kafka.UserEventProducer;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final JwtService jwtService;
    private final UserEventProducer userEventProducer;
    private final AuthCodeStore authCodeStore;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2User user = (OAuth2User) authentication.getPrincipal();
        String googleSub = user.getAttribute("sub");
        String email = user.getAttribute("email");
        String name = user.getAttribute("name");

        userEventProducer.publish(new UserAuthenticatedEvent(googleSub, email, name));

        String accessToken = jwtService.generateAccessToken(googleSub, email, name);
        String refreshToken = jwtService.generateRefreshToken(googleSub);

        ResponseCookie cookie = ResponseCookie.from("refresh_token", refreshToken)
                .httpOnly(true)
                .path("/auth/refresh")
                .maxAge(7L * 24 * 60 * 60)
                .build();
        response.addHeader("Set-Cookie", cookie.toString());

        String code = authCodeStore.issueCode(accessToken);
        response.sendRedirect(frontendUrl + "/home?code=" + code);
    }
}
