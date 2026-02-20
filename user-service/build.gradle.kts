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
    implementation(libs.postgresql)
    implementation(libs.spring.cloud.eureka.client)
    implementation(libs.spring.kafka)

    jooqGenerator(libs.postgresql)

    compileOnly(libs.lombok)
    annotationProcessor(libs.lombok)
}

val localProps = java.util.Properties().also { props ->
    val f = rootProject.file("local.properties")
    if (f.exists()) props.load(f.inputStream())
}

fun prop(envKey: String, localKey: String, default: String): String =
    providers.environmentVariable(envKey).orNull
        ?: localProps.getProperty(localKey)
        ?: default

jooq {
    version.set(libs.versions.jooq.get())
    configurations {
        create("main") {
            jooqConfiguration.apply {
                jdbc.apply {
                    driver = "org.postgresql.Driver"
                    url = prop("JOOQ_DB_URL", "jooq.db.url", "jdbc:postgresql://localhost:5432/userdb")
                    user = prop("JOOQ_DB_USER", "jooq.db.user", "user_service")
                    password = prop("JOOQ_DB_PASSWORD", "jooq.db.password", "user_pw")
                }
                generator.apply {
                    database.apply {
                        name = "org.jooq.meta.postgres.PostgresDatabase"
                        inputSchema = "public"
                        includes = "users"
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
