FROM maven:3.8.4-openjdk-17-slim AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

FROM openjdk:17-jdk-slim
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

# Strict memory limits for Render Free Tier (512MB)
# -Xmx256m: Max Heap
# -Xms128m: Initial Heap
# -Xss512k: Thread stack size
# -XX:MaxMetaspaceSize=96m: limit metadata memory
# -Djava.security.egd=file:/dev/./urandom: Faster startup
# -Djava.awt.headless=true: Save memory by not loading UI libs
ENTRYPOINT ["java", "-Xmx256m", "-Xms128m", "-Xss512k", "-XX:MaxMetaspaceSize=96m", "-Djava.security.egd=file:/dev/./urandom", "-Djava.awt.headless=true", "-jar", "app.jar"]
