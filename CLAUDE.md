# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Run Commands

```bash
# Build all modules
./gradlew build

# Build a specific module
./gradlew :user-service:build
./gradlew :gateway-service:build
./gradlew :common-library:build

# Run a service locally
./gradlew :user-service:bootRun
./gradlew :gateway-service:bootRun

# Run tests
./gradlew test
./gradlew :user-service:test

# Start local infrastructure (Kafka, PostgreSQL)
docker compose up -d
```

## Architecture Overview

This is an early-stage Spring Boot microservices platform using a multi-module Gradle build.

**Request flow:**
```
Client → Gateway Service (port 8081) → User Service (port 8080)
```

The gateway routes `/users/**` paths to the user-service via Spring Cloud Gateway (reactive/Webflux). The user-service uses Spring MVC (servlet-based). Note that mixing reactive and servlet stacks is intentional here — gateway uses Webflux, downstream services use MVC.

**Modules:**
- `common-library` — shared code imported by other services (Java library, no Spring)
- `gateway-service` — Spring Cloud Gateway; all routing config lives in `gateway-service/src/main/resources/application.yml`
- `user-service` — Spring MVC REST service; currently has a stub `GET /users` endpoint

**Infrastructure (docker-compose.yaml):**
- PostgreSQL 15 on port 5432 (`userdb`, user: `user_service`) for the user-service
- Kafka + Zookeeper on port 9092 (Confluent 7.5.0) — infrastructure is ready but not yet used in code
- Kafka UI on port 8888

## Tech Stack

- Java 21, Spring Boot 3.2.3, Spring Cloud 2023.0.3
- Gradle 9.3.0 with version catalog at `gradle/libs.versions.toml`
- Lombok used in user-service
- Build features enabled: configuration cache, parallel builds, build cache

## Key Conventions

- Group ID: `ru.mopkovka`
- All dependency versions are managed centrally in `gradle/libs.versions.toml`
- Submodule dependencies (e.g., `common-library`) are referenced via `project(":common-library")` in module `build.gradle.kts` files
