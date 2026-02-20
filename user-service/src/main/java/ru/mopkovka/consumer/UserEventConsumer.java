package ru.mopkovka.consumer;

import lombok.RequiredArgsConstructor;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import ru.mopkovka.common.KafkaTopics;
import ru.mopkovka.common.UserAuthenticatedEvent;
import ru.mopkovka.common.UserLoggedInEvent;
import ru.mopkovka.common.UserRegisteredEvent;
import ru.mopkovka.kafka.UserEventPublisher;
import ru.mopkovka.repository.UserRepository;

@Component
@RequiredArgsConstructor
public class UserEventConsumer {

    private final UserRepository userRepository;
    private final UserEventPublisher userEventPublisher;

    @KafkaListener(topics = KafkaTopics.USER_AUTHENTICATED, groupId = "user-service")
    public void consume(UserAuthenticatedEvent event) {
        if (userRepository.existsByGoogleSub(event.googleSub())) {
            userRepository.updateLastLogin(event.googleSub());
            userEventPublisher.publishLoggedIn(new UserLoggedInEvent(event.googleSub()));
        } else {
            userRepository.insert(event);
            userEventPublisher.publishRegistered(new UserRegisteredEvent(
                    event.googleSub(), event.email(), event.name()));
        }
    }
}
