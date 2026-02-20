plugins {
    alias(libs.plugins.spring.boot)
    alias(libs.plugins.dependency.management)
    id("java")
}

dependencies {
    implementation(project(":auth-common"))
    implementation(project(":common-library"))
    implementation(libs.spring.boot.starter.actuator)
    implementation(libs.spring.boot.starter.web)
    implementation(libs.spring.boot.starter.oauth2.client)
    implementation(libs.spring.cloud.eureka.client)
    implementation(libs.spring.cloud.vault.config)
    implementation(libs.spring.kafka)

    compileOnly(libs.lombok)
    annotationProcessor(libs.lombok)
}
