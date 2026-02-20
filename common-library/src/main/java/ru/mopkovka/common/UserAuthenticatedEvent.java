package ru.mopkovka.common;

/** Публикуется orchestration-service после успешной OAuth2 аутентификации. */
public record UserAuthenticatedEvent(String googleSub, String email, String name) {}
