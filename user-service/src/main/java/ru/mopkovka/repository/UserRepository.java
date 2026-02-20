package ru.mopkovka.repository;

import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.jooq.impl.DSL;
import org.springframework.stereotype.Repository;
import ru.mopkovka.common.UserAuthenticatedEvent;

import static ru.mopkovka.jooq.tables.Users.USERS;

@Repository
@RequiredArgsConstructor
public class UserRepository {

    private final DSLContext dsl;

    public boolean existsByGoogleSub(String googleSub) {
        return dsl.fetchExists(USERS, USERS.GOOGLE_SUB.eq(googleSub));
    }

    public void insert(UserAuthenticatedEvent event) {
        dsl.insertInto(USERS)
                .set(USERS.GOOGLE_SUB, event.googleSub())
                .set(USERS.EMAIL, event.email())
                .set(USERS.NAME, event.name())
                .execute();
    }

    public void updateLastLogin(String googleSub) {
        dsl.update(USERS)
                .set(USERS.LAST_LOGIN, DSL.currentLocalDateTime())
                .where(USERS.GOOGLE_SUB.eq(googleSub))
                .execute();
    }
}
