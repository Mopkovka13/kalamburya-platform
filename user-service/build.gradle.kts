import org.jooq.meta.jaxb.Property

plugins {
    alias(libs.plugins.spring.boot)
    alias(libs.plugins.dependency.management)
    id("java")
    alias(libs.plugins.jooq)
}

dependencies {
    implementation(project(":common-library"))
    implementation(libs.spring.boot.starter.actuator)
    implementation(libs.spring.boot.starter.web)
    implementation(libs.spring.boot.starter.jooq)
    implementation(libs.flyway.core)
    runtimeOnly(libs.flyway.database.postgresql)
    implementation(libs.postgresql)
    implementation(libs.spring.cloud.eureka.client)
    implementation(libs.spring.kafka)

    jooqGenerator("org.jooq:jooq-meta-extensions:${versionCatalogs.named("libs").findVersion("jooq").get().requiredVersion}")

    compileOnly(libs.lombok)
    annotationProcessor(libs.lombok)
}

val jooqVersion: String = versionCatalogs.named("libs").findVersion("jooq").get().requiredVersion

jooq {
    version.set(jooqVersion)
    configurations {
        create("main") {
            jooqConfiguration.apply {
                generator.apply {
                    database.apply {
                        name = "org.jooq.meta.extensions.ddl.DDLDatabase"
                        includes = "users"
                        properties.add(Property().apply {
                            key = "scripts"
                            value = "src/main/resources/db/migration/*.sql"
                        })
                        properties.add(Property().apply {
                            key = "sort"
                            value = "flyway"
                        })
                    }
                    target.apply {
                        packageName = "ru.mopkovka.jooq"
                        directory = "src/generated/jooq"
                    }
                }
            }
        }
    }
}
