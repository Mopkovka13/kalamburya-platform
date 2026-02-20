package ru.mopkovka.common;

public final class KafkaTopics {

    /** orchestration-service → user-service: факт аутентификации через OAuth2. */
    public static final String USER_AUTHENTICATED = "user-authenticated";

    /** user-service → *: первый вход, пользователь только что зарегистрирован. */
    public static final String USER_REGISTERED = "user-registered";

    /** user-service → *: повторный вход существующего пользователя. */
    public static final String USER_LOGGED_IN = "user-logged-in";

    private KafkaTopics() {}
}
