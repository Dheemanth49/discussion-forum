# Use Eclipse Temurin for the build stage
FROM maven:3.8.5-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Use Eclipse Temurin JRE for the runtime stage (lighter and supported)
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

# JVM memory limits for Render Free Tier (512MB)
ENTRYPOINT ["java", "-Xmx256m", "-Xms128m", "-Xss512k", "-XX:MaxMetaspaceSize=96m", "-Djava.security.egd=file:/dev/./urandom", "-Djava.awt.headless=true", "-jar", "app.jar"]
