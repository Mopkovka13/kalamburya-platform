package ru.mopkovka.common;

/** Публикуется user-service при повторном входе существующего пользователя. */
public record UserLoggedInEvent(String googleSub) {}
