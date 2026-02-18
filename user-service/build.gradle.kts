plugins {
    id("org.springframework.boot") version libs.versions.spring.boot
    id("io.spring.dependency-management") version libs.versions.dependency.management
    id("java")
}

dependencies {
    implementation(project(":common-library"))
    implementation("org.springframework.boot:spring-boot-starter-web")

    compileOnly("org.projectlombok:lombok:${libs.versions.lombok.get()}")
    annotationProcessor("org.projectlombok:lombok:${libs.versions.lombok.get()}")
}