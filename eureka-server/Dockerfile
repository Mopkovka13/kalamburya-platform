FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app
COPY gradlew ./
COPY gradle/ gradle/
COPY eureka-server/settings.gradle.kts settings.gradle.kts
COPY eureka-server/build.gradle.kts build.gradle.kts
COPY eureka-server/src/ src/
RUN ./gradlew bootJar --no-daemon -x test

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=builder /app/build/libs/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
