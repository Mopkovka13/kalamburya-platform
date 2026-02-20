package ru.mopkovka.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import ru.mopkovka.auth.JwtService;

@Configuration
public class GatewayConfig {

    @Bean
    public JwtService jwtService(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.access-expiry-seconds:900}") long accessExpirySeconds,
            @Value("${jwt.refresh-expiry-seconds:604800}") long refreshExpirySeconds) {
        return new JwtService(secret, accessExpirySeconds, refreshExpirySeconds);
    }
}
