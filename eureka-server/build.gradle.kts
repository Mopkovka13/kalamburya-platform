plugins {
    alias(libs.plugins.spring.boot)
    alias(libs.plugins.dependency.management)
    id("java")
}

dependencies {
    implementation(libs.spring.cloud.eureka.server)
    implementation(libs.spring.boot.starter.actuator)
}
