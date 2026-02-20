package ru.mopkovka.common;

/** Публикуется user-service при первом входе пользователя (регистрация). */
public record UserRegisteredEvent(String googleSub, String email, String name) {}
