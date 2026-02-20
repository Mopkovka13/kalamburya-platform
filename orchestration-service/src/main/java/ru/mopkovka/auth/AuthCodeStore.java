package ru.mopkovka.auth;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Iterator;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class AuthCodeStore {

    private static final long TTL_SECONDS = 30;

    private record Entry(String accessToken, Instant expiresAt) {}

    private final Map<String, Entry> store = new ConcurrentHashMap<>();

    public String issueCode(String accessToken) {
        evictExpired();
        String code = UUID.randomUUID().toString();
        store.put(code, new Entry(accessToken, Instant.now().plusSeconds(TTL_SECONDS)));
        return code;
    }

    /** Возвращает токен и удаляет code (одноразовый). Null если code не найден или истёк. */
    public String redeemCode(String code) {
        evictExpired();
        Entry entry = store.remove(code);
        if (entry == null || Instant.now().isAfter(entry.expiresAt())) {
            return null;
        }
        return entry.accessToken();
    }

    private void evictExpired() {
        Instant now = Instant.now();
        Iterator<Map.Entry<String, Entry>> it = store.entrySet().iterator();
        while (it.hasNext()) {
            if (now.isAfter(it.next().getValue().expiresAt())) {
                it.remove();
            }
        }
    }
}
