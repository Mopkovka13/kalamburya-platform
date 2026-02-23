plugins {
    alias(libs.plugins.spring.boot)
    alias(libs.plugins.dependency.management)
    id("java")
}

group = "ru.mopkovka"
version = "0.0.1-SNAPSHOT"

repositories {
    mavenCentral()
}

java {
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(21))
    }
}

dependencyManagement {
    imports {
        mavenBom("org.springframework.cloud:spring-cloud-dependencies:${libs.versions.spring.cloud.get()}")
    }
}

dependencies {
    implementation(libs.spring.cloud.eureka.server)
    implementation(libs.spring.boot.starter.actuator)
}
