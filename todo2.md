1. TOCTOU race condition в UserEventConsumer (user-service)                   
                                                                                
  user-service/.../consumer/UserEventConsumer.java                              
                                                                                
  if (userRepository.existsByGoogleSub(event.googleSub())) {                    
      userRepository.updateLastLogin(...);                                      
  } else {
      userRepository.insert(event);
  }

  existsByGoogleSub + insert — две отдельные операции без @Transactional. При
  дублировании Kafka-сообщения (at-least-once) оба потока увидят exists = false,
   оба вызовут insert → нарушение PRIMARY KEY. Без error handler/DLQ это
  заблокирует партицию бесконечными ретраями. Нужен INSERT ... ON CONFLICT DO
  UPDATE (upsert).

  ---
  2. Refresh token теряет email и name

  orchestration-service/.../auth/AuthController.java:50

  String newAccessToken = jwtService.generateAccessToken(googleSub, null, null);

  После рефреша access token приходит без email и name claims. Любой
  downstream-сервис, который читает эти claims, сломается после первого refresh
  (через 15 минут).

  ---
  3. JwtService — charset-зависимость

  auth-common/.../auth/JwtService.java:17

  this.key = Keys.hmacShaKeyFor(secret.getBytes());

  getBytes() без явного charset использует дефолт платформы. Если gateway и
  orchestration-service окажутся на разных JVM/контейнерах с разным дефолтным
  charset, JWT подписи не совпадут. Нужен StandardCharsets.UTF_8.

  ---
  4. Нет Dockerfile для eureka-server

  docker-compose.yaml:4-6 ссылается на eureka-server/Dockerfile, которого нет в
  репозитории. docker compose up упадёт.

  ---
  5. login() в AuthContext — мёртвый код

  frontend/src/contexts/AuthContext.tsx

  Функция login(t: string) экспортируется из контекста, но нигде не вызывается.
  Раньше она использовалась в HomePage, но после рефакторинга обмен кода
  переехал в AuthProvider — login стала бесполезной.

  ---
  6. Hardcoded spring.json.value.default.type для Kafka consumer

  user-service/src/main/resources/application.yml

  spring.json.value.default.type: "ru.mopkovka.common.UserAuthenticatedEvent"

  Все сообщения на всех топиках десериализуются в один тип. При добавлении
  второго топика/типа — сломается. Producer уже шлёт type headers, достаточно
  использовать их.

  ---
  7. CORS настроен только на orchestration-service, но не на gateway

  orchestration-service/.../config/SecurityConfig.java

  CORS разрешает frontendUrl только в SecurityConfig orchestration-service. Но
  фронтенд шлёт запросы через gateway (порт 8081). Gateway не имеет
  CORS-конфигурации. Сейчас работает потому что gateway просто проксирует, и
  CORS-заголовки приходят от orchestration-service — но preflight
  OPTIONS-запросы могут не доходить до orchestration-service, если gateway их не
   пропускает.

  ---
  8. refresh_token cookie с path=/auth/refresh — не отправляется при logout

  OAuth2SuccessHandler.java:50, AuthController.java:69

  Cookie установлена с path("/auth/refresh"). При запросе POST /auth/logout
  браузер не отправит эту cookie (путь не совпадает). Logout чистит cookie
  server-side (maxAge=0), но для этого нужно чтобы браузер отправил запрос на
  правильный path. Сейчас Set-Cookie с path=/auth/refresh и maxAge=0
  отправляется в response /auth/logout — это работает (браузер удалит cookie по
  Set-Cookie header), но хрупко.

  ---
  9. Нет actuator/health эндпоинтов для проверки готовности downstream сервисов

  Gateway роутит на lb://orchestration-service и lb://user-service через Eureka,
   но нет circuit breaker'ов и нет health check'ов в gateway-конфиге. Если
  orchestration-service упал, gateway вернёт 500/503 без graceful degradation.

  ---
  Из этих замечаний самые критичные для продакшена — #1 (потеря сообщений
  Kafka), #2 (сломанный токен после refresh) и #3 (потенциально несовместимые
  JWT между сервисами).


