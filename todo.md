# TODO: Kalamburya Platform - Замечания и улучшения

Замечания отсортированы от самых серьезных к менее критичным.

---

## 1. CRITICAL — Сломанный auth flow на фронтенде

**Файл:** `frontend/src/pages/HomePage.tsx:51`

OAuth2SuccessHandler редиректит на `/home?code=<uuid>`, но фронтенд читает параметр `token` вместо `code` и пытается использовать значение как готовый JWT, вместо того чтобы обменять code через `POST /auth/token`.

```typescript
// Сейчас (сломано):
const t = params.get('token')
if (t) { login(t) }

// Должно быть:
const code = params.get('code')
if (code) {
  const res = await authApi.post('/auth/token', null, { params: { code } })
  login(res.data.accessToken)
}
```

**Результат:** Аутентификация полностью не работает. `AuthCodeStore.redeemCode()` никогда не вызывается, access token никогда не попадает на фронтенд.

---

## 2. CRITICAL — Отсутствует зависимость `flyway-database-postgresql`

**Файл:** `user-service/build.gradle.kts`

Начиная с Flyway 10.x, модуль `flyway-core` не включает драйверы баз данных. Нужна дополнительная зависимость `org.flywaydb:flyway-database-postgresql`. Без неё Flyway упадёт при старте user-service.

```kotlin
// Добавить в libs.versions.toml:
flyway-postgresql = { module = "org.flywaydb:flyway-database-postgresql", version.ref = "flyway" }

// Добавить в user-service/build.gradle.kts:
implementation(libs.flyway.postgresql)
```

---

## 3. HIGH — Фронтенд обходит gateway, hardcoded URL-ы

**Файлы:**
- `frontend/src/api/authApi.ts:3` — `baseURL: 'http://localhost:8082'`
- `frontend/src/pages/LoginPage.tsx:40` — `window.location.href = 'http://localhost:8082/oauth2/authorization/google'`

Фронтенд обращается напрямую к orchestration-service (порт 8082), полностью минуя gateway (8081). Плюс все URL-ы захардкожены как `localhost`, что делает невозможным деплой на удалённый сервер.

**Решение:** Использовать переменные окружения через Vite (`import.meta.env.VITE_API_URL`) и направлять трафик через gateway.

---

## 4. HIGH — Cookie `refresh_token` без флагов `Secure` и `SameSite`

**Файлы:**
- `orchestration-service/src/main/java/ru/mopkovka/oauth2/OAuth2SuccessHandler.java:43-47`
- `orchestration-service/src/main/java/ru/mopkovka/auth/AuthController.java:52-56`

Refresh token cookie устанавливается без `Secure` (передаётся по HTTP) и без `SameSite` (уязвимость к CSRF). Это позволяет перехватить cookie при MITM-атаке и использовать его из сторонних сайтов.

```java
// Нужно добавить:
.secure(true)
.sameSite("Strict") // или "Lax"
```

---

## 5. HIGH — Gateway не маршрутизирует OAuth2 flow

**Файл:** `gateway-service/src/main/resources/application.yml:9-17`

Gateway имеет маршруты только для `/auth/**` и `/users/**`, но OAuth2 flow использует пути `/oauth2/authorization/google` и `/login/oauth2/code/google`. Даже если фронтенд перенаправить через gateway, OAuth2 flow не будет работать без дополнительных маршрутов.

```yaml
# Нужно добавить:
- id: oauth2-flow
  uri: lb://orchestration-service
  predicates:
    - Path=/oauth2/**,/login/**
```

---

## 6. HIGH — Нет тестов

Ни в одном модуле нет unit- или integration-тестов. Критически важные компоненты без тестового покрытия:
- `JwtService` — генерация и валидация токенов
- `AuthCodeStore` — выдача и погашение кодов, TTL
- `OAuth2SuccessHandler` — весь auth flow
- `UserEventConsumer` — Kafka consumer logic (upsert)
- `UserRepository` — SQL-запросы через jOOQ

---

## 7. HIGH — `AuthCodeStore` — in-memory, не масштабируется

**Файл:** `orchestration-service/src/main/java/ru/mopkovka/auth/AuthCodeStore.java`

`ConcurrentHashMap` хранит auth codes в памяти одного инстанса. При запуске нескольких экземпляров orchestration-service (за load balancer) code, выданный одним инстансом, не будет найден другим.

**Решение:** Использовать Redis или другое внешнее хранилище для auth codes.

---

## 8. MEDIUM — `UserRegisteredEvent` и `UserLoggedInEvent` никем не потребляются

**Файл:** `user-service/src/main/java/ru/mopkovka/kafka/UserEventPublisher.java`

user-service публикует события в топики `user-registered` и `user-logged-in`, но ни один сервис не имеет `@KafkaListener` для этих топиков. Это dead-end events — потребители либо ещё не реализованы, либо топики не нужны.

---

## 9. MEDIUM — Нет обработки ошибок в Kafka consumer

**Файл:** `user-service/src/main/java/ru/mopkovka/consumer/UserEventConsumer.java`

Если `userRepository.insert()` или `userRepository.updateLastLogin()` выбросит исключение (например, БД недоступна), сообщение будет потеряно или бесконечно ретрайтиться (зависит от конфигурации). Нет:
- Dead Letter Queue (DLQ)
- Retry policy
- Error handler
- Логирования ошибок

---

## 10. MEDIUM — Race condition в `UserEventConsumer`

**Файл:** `user-service/src/main/java/ru/mopkovka/consumer/UserEventConsumer.java:22-29`

`existsByGoogleSub()` + `insert()` — не атомарная операция. При параллельной обработке двух событий для одного пользователя (или при ретрае) возможен duplicate key exception, потому что между проверкой и вставкой другой поток может вставить запись.

**Решение:** Использовать `INSERT ... ON CONFLICT DO UPDATE` (upsert) через jOOQ.

---

## 11. MEDIUM — `JwtService.generateAccessToken()` с null email/name при refresh

**Файл:** `orchestration-service/src/main/java/ru/mopkovka/auth/AuthController.java:43`

```java
jwtService.generateAccessToken(googleSub, null, null);
```

При обновлении access token через refresh endpoint, email и name не передаются (нет в refresh token claims). Это значит, что обновлённый access token не будет содержать email и name claims, хотя первоначальный их содержал. Downstream сервисы могут на них полагаться.

---

## 12. MEDIUM — Нет Kafka producer callback / error handling

**Файлы:**
- `orchestration-service/src/main/java/ru/mopkovka/kafka/UserEventProducer.java:15`
- `user-service/src/main/java/ru/mopkovka/kafka/UserEventPublisher.java:16-17`

`kafkaTemplate.send()` возвращает `CompletableFuture`, который игнорируется. Если Kafka недоступен или сообщение не доставлено, ошибка будет молча проглочена.

---

## 13. MEDIUM — CSRF отключён без замены

**Файл:** `orchestration-service/src/main/java/ru/mopkovka/config/SecurityConfig.java:25`

CSRF отключён глобально. Для SPA с cookie-based refresh token это создаёт уязвимость: злоумышленник может отправить `POST /auth/refresh` с чужими cookies. Флаг `SameSite` на cookie (пункт 4) частично решает проблему, но не для всех браузеров.

---

## 14. MEDIUM — Downstream сервисы не защищены от прямого доступа

**Файлы:**
- `user-service/src/main/java/ru/mopkovka/controller/UserController.java`
- `orchestration-service` — SecurityConfig разрешает `/auth/**` без токена

Gateway инжектит `X-User-Id` после валидации JWT, но downstream сервисы не проверяют, что запрос пришёл через gateway. Если user-service доступен по сети напрямую (порт 8080), `X-User-Id` header можно подделать.

**Решение:** Добавить shared secret между gateway и downstream сервисами, или сетевую изоляцию.

---

## 15. MEDIUM — Нет логирования

Ни в одном сервисе нет `Logger` / `@Slf4j`. Ключевые операции (OAuth2 success, Kafka publish/consume, JWT validation failure, DB operations) не логируются. Отладка в production будет крайне затруднена.

---

## 16. LOW — `UserController` содержит только заглушку

**Файл:** `user-service/src/main/java/ru/mopkovka/controller/UserController.java`

Единственный endpoint — `GET /users` → `"Hello from User Service!"`. Нет реальных endpoints для получения данных пользователя (`GET /users/me`, `GET /users/{id}`).

---

## 17. LOW — `AuthCodeStore` eviction на каждую операцию

**Файл:** `orchestration-service/src/main/java/ru/mopkovka/auth/AuthCodeStore.java:37-44`

`evictExpired()` итерирует всю map на каждый вызов `issueCode()` и `redeemCode()`. При высокой нагрузке это создаёт O(n) overhead. Лучше использовать `ScheduledExecutorService` для фоновой очистки или `Caffeine`/`Guava Cache` с TTL.

---

## 18. LOW — Дублирование конфигурации `JwtService` bean

**Файлы:**
- `gateway-service/src/main/java/ru/mopkovka/config/GatewayConfig.java:11-17`
- `orchestration-service/src/main/java/ru/mopkovka/config/SecurityConfig.java:44-50`

Одинаковый bean `JwtService` создаётся в двух сервисах с идентичным кодом. Если `JwtService` станет Spring-managed (например, через `@Component` + `@ConfigurationProperties`), дублирование уйдёт. Или можно вынести конфигурацию в `auth-common`.

---

## 19. LOW — Нет Dockerfiles для backend-сервисов (кроме eureka)

Только `eureka-server/Dockerfile` существует. Для полноценного деплоя (docker-compose или Kubernetes) нужны Dockerfiles для gateway-service, orchestration-service и user-service.

---

## 20. LOW — Inline-стили в React компонентах

**Файлы:**
- `frontend/src/pages/LoginPage.tsx`
- `frontend/src/pages/HomePage.tsx`

Все стили определены как `Record<string, React.CSSProperties>` inline-объекты. Нет CSS-модулей, styled-components или Tailwind. При росте проекта это будет сложно поддерживать.

---

## 21. LOW — Нет CI/CD pipeline

Отсутствует конфигурация для GitHub Actions, GitLab CI или аналогов. Нет автоматической сборки, прогона тестов и деплоя.

---

## 22. LOW — Kafka healthcheck отсутствует в docker-compose

**Файл:** `docker-compose.yaml:36-55`

Сервис `kafka` не имеет healthcheck. `kafka-ui` зависит от kafka через простой `depends_on` без condition, поэтому может запуститься раньше, чем Kafka будет готов.

---

## 23. LOW — Пароль БД захардкожен в `application-dev.yml`

**Файл:** `user-service/src/main/resources/application-dev.yml:6`

```yaml
password: user_pw
```

Для dev-профиля это допустимо, но лучше вынести в `.env` или Vault, чтобы не коммитить пароли в репозиторий. Vault для user-service не используется (нет зависимости `spring-cloud-vault-config` в build.gradle.kts).

---

## 24. INFO — Vault dev mode — нет production-конфигурации

Vault запущен в dev mode с root-токеном `root`. Это нормально для разработки, но для production нужна отдельная конфигурация с seal/unseal, ACL policies и proper auth methods.

---

## 25. INFO — `spring.application.name` не задан в eureka-server

**Файл:** `eureka-server/src/main/resources/application.yml`

Хотя для Eureka server это не критично (он сам себя не регистрирует), для единообразия стоит добавить `spring.application.name: eureka-server`.
