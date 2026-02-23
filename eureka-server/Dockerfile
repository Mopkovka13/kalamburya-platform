FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app
COPY gradlew settings.gradle.kts build.gradle.kts ./
COPY gradle/ gradle/
COPY eureka-server/ eureka-server/
RUN ./gradlew :eureka-server:bootJar --no-daemon -x test

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=builder /app/eureka-server/build/libs/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
