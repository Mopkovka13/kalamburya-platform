package ru.mopkovka.kafka;

import lombok.RequiredArgsConstructor;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import ru.mopkovka.common.KafkaTopics;
import ru.mopkovka.common.UserAuthenticatedEvent;

@Component
@RequiredArgsConstructor
public class UserEventProducer {

    private final KafkaTemplate<String, UserAuthenticatedEvent> kafkaTemplate;

    public void publish(UserAuthenticatedEvent event) {
        kafkaTemplate.send(KafkaTopics.USER_AUTHENTICATED, event.googleSub(), event);
    }
}
