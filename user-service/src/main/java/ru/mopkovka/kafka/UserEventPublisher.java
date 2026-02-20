package ru.mopkovka.kafka;

import lombok.RequiredArgsConstructor;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import ru.mopkovka.common.KafkaTopics;
import ru.mopkovka.common.UserLoggedInEvent;
import ru.mopkovka.common.UserRegisteredEvent;

@Component
@RequiredArgsConstructor
public class UserEventPublisher {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void publishRegistered(UserRegisteredEvent event) {
        kafkaTemplate.send(KafkaTopics.USER_REGISTERED, event.googleSub(), event);
    }

    public void publishLoggedIn(UserLoggedInEvent event) {
        kafkaTemplate.send(KafkaTopics.USER_LOGGED_IN, event.googleSub(), event);
    }
}
