CREATE TABLE IF NOT EXISTS users (
    google_sub  VARCHAR(255) PRIMARY KEY,
    email       VARCHAR(255) NOT NULL,
    name        VARCHAR(255),
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    last_login  TIMESTAMP NOT NULL DEFAULT NOW()
);
