# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Run Commands

```bash
# Build all modules
./gradlew build

# Build a specific module
./gradlew :user-service:build
./gradlew :orchestration-service:build
./gradlew :gateway-service:build
./gradlew :eureka-server:build

# Run services locally (use dev profile for local infra URLs)
SPRING_PROFILES_ACTIVE=dev ./gradlew :eureka-server:bootRun
SPRING_PROFILES_ACTIVE=dev ./gradlew :orchestration-service:bootRun
SPRING_PROFILES_ACTIVE=dev ./gradlew :gateway-service:bootRun
SPRING_PROFILES_ACTIVE=dev ./gradlew :user-service:bootRun

# Run tests
./gradlew test
./gradlew :user-service:test

# Start local infrastructure (PostgreSQL, Kafka, Eureka in Docker)
docker compose up -d

# Regenerate jOOQ classes from SQL migrations (no live DB needed)
./gradlew :user-service:generateJooq
```

### Local development setup

1. Убедись, что в `.env` указан правильный хост удалённой машины (по умолчанию `mopkovka.sytes.net`):
   ```
   REMOTE_HOST=mopkovka.sytes.net
   ```
   Этот хост используется в `docker-compose.yaml` и во всех `application-dev.yml`.
2. `docker compose up -d` — starts PostgreSQL, Kafka/Zookeeper, Kafka UI, and Eureka server.
2. Скопируй `.env.secrets.example` → `.env.secrets` и заполни секретами. Vault (dev mode) заполняется автоматически при `docker compose up` через сервис `vault-init`:
   - `secret/application` → `jwt.secret`
   - `secret/orchestration-service` → `client-id`, `client-secret` (Google OAuth2)
3. Start backend services with `SPRING_PROFILES_ACTIVE=dev` (see `application-dev.yml` in each module for local URL overrides).
4. Frontend: `cd frontend && npm install && npm run dev` (runs on port 3000).

## Architecture Overview

OAuth2 Google login platform using Spring Boot microservices.

**Service ports:**
| Service | Port |
|---|---|
| Frontend (Vite/React) | 3000 |
| gateway-service | 8081 |
| orchestration-service (auth) | 8082 |
| user-service | 8080 |
| eureka-server | 8761 |
| Vault | ${REMOTE_HOST}:8200 |
| PostgreSQL | 5432 |
| Kafka (host) | 9093 |
| Kafka UI | 8888 |

**Authentication flow:**
```
1. Frontend → /auth/login/oauth2/google  (via gateway → orchestration-service)
2. Google OAuth2 callback → orchestration-service
3. OAuth2SuccessHandler: issues JWT pair, stores access token in AuthCodeStore (30s TTL),
   sets refresh_token HttpOnly cookie, redirects → frontend /home?code=<uuid>
4. Frontend POSTs code to POST /auth/token → receives access token
5. All subsequent API calls: Authorization: Bearer <access-token> → gateway
6. JwtAuthFilter (gateway) validates JWT, injects X-User-Id header, forwards downstream
7. orchestration-service publishes UserAuthenticatedEvent to Kafka topic "user-authenticated"
8. user-service consumes event: upserts user in PostgreSQL via jOOQ,
   publishes UserRegisteredEvent or UserLoggedInEvent
```

**Modules:**
- `auth-common` — `JwtService` (plain Java, no Spring); shared by gateway-service and orchestration-service for JWT sign/verify
- `common-library` — Kafka event records (`UserAuthenticatedEvent`, `UserRegisteredEvent`, `UserLoggedInEvent`) and `KafkaTopics` constants; no Spring dependency
- `eureka-server` — Netflix Eureka; gateway and all services register here for `lb://` load-balanced routing
- `gateway-service` — Spring Cloud Gateway (Webflux); `JwtAuthFilter` validates JWT and injects `X-User-Id`; routes `/auth/**` → `lb://orchestration-service`, `/users/**` → `lb://user-service`
- `orchestration-service` — Spring MVC; Google OAuth2 login; JWT issuance; `AuthCodeStore` (in-memory, single-instance only); Kafka producer
- `user-service` — Spring MVC; Kafka consumer (`user-authenticated` topic); jOOQ + Flyway for PostgreSQL; `UserRepository` with `existsByGoogleSub`, `insert`, `updateLastLogin`
- `frontend` — React + TypeScript + Vite SPA; `AuthContext` manages access token in memory; `authApi` axios instance points directly at orchestration-service (port 8082, not via gateway)

## Tech Stack

- Java 21, Spring Boot 3.2.3, Spring Cloud 2023.0.3
- Gradle 9.3.0 with version catalog at `gradle/libs.versions.toml`
- Lombok used in user-service and orchestration-service
- jOOQ (type-safe SQL) + Flyway (migrations) in user-service; generated classes at `user-service/src/generated/jooq`
- HashiCorp Vault (dev mode) for secrets: `jwt.secret` in `secret/application`, OAuth2 credentials in `secret/orchestration-service`
- Kafka (Confluent 7.5.0); JSON serialization; trusted package `ru.mopkovka.common`

## Key Conventions

- Group ID: `ru.mopkovka`
- All dependency versions managed in `gradle/libs.versions.toml`
- Submodule dependencies use `project(":module-name")` in `build.gradle.kts`
- `application-dev.yml` in each service overrides Vault URI, Eureka URL, Kafka bootstrap servers, and app base URLs for local development
- Gateway and user-service stacks intentionally differ: gateway = Webflux (reactive), downstream services = Spring MVC (servlet)
- `AuthCodeStore` is in-memory and single-instance only; not suitable for multi-instance deployments
- jOOQ codegen uses `DDLDatabase` — reads SQL migrations directly, no live DB connection needed
