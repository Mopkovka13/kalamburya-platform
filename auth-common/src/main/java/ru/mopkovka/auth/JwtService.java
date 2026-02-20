package ru.mopkovka.auth;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

import javax.crypto.SecretKey;
import java.util.Date;

public class JwtService {

    private final SecretKey key;
    private final long accessExpirySeconds;
    private final long refreshExpirySeconds;

    public JwtService(String secret, long accessExpirySeconds, long refreshExpirySeconds) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes());
        this.accessExpirySeconds = accessExpirySeconds;
        this.refreshExpirySeconds = refreshExpirySeconds;
    }

    public String generateAccessToken(String googleSub, String email, String name) {
        var builder = Jwts.builder()
                .subject(googleSub)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + accessExpirySeconds * 1000L));
        if (email != null) builder.claim("email", email);
        if (name != null)  builder.claim("name", name);
        return builder.signWith(key).compact();
    }

    public String generateRefreshToken(String googleSub) {
        return Jwts.builder()
                .subject(googleSub)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + refreshExpirySeconds * 1000L))
                .signWith(key)
                .compact();
    }

    public Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
