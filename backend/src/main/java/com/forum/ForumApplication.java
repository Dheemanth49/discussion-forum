package com.forum;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import io.github.cdimascio.dotenv.Dotenv;

import java.util.TimeZone;

@SpringBootApplication
public class ForumApplication {

    public static void main(String[] args) {
        // Fix for Docker PostgreSQL not recognizing deprecated "Asia/Calcutta"
        TimeZone.setDefault(TimeZone.getTimeZone("Asia/Kolkata"));

        Dotenv dotenv = Dotenv.configure()
                .directory("./")
                .ignoreIfMissing()
                .load();

        dotenv.entries().forEach(entry -> {
            System.setProperty(entry.getKey(), entry.getValue());
        });

        SpringApplication.run(ForumApplication.class, args);
    }
}
