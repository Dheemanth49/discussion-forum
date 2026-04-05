package com.forum.config;

import com.forum.model.Category;
import com.forum.model.Role;
import com.forum.model.User;
import com.forum.repository.CategoryRepository;
import com.forum.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${admin.username}")
    private String adminUsername;

    @Value("${admin.email}")
    private String adminEmail;

    @Value("${admin.password}")
    private String adminPassword;

    @Override
    public void run(String... args) {
        // Seed categories if empty
        if (categoryRepository.count() == 0) {
            List<Category> categories = List.of(
                Category.builder().name("General").description("General discussions and announcements").iconName("chat").build(),
                Category.builder().name("Technology").description("Programming, software, and tech topics").iconName("code").build(),
                Category.builder().name("Science").description("Scientific discussions and discoveries").iconName("science").build(),
                Category.builder().name("Education").description("Learning resources and academic help").iconName("school").build(),
                Category.builder().name("Career").description("Job advice, interviews, and career growth").iconName("work").build(),
                Category.builder().name("Sports").description("Sports news and discussions").iconName("sports").build()
            );
            categoryRepository.saveAll(categories);
            log.info("Seeded {} categories", categories.size());
        }

        // Create a default admin if none exists
        if (!userRepository.existsByEmail(adminEmail)) {
            User admin = User.builder()
                    .username(adminUsername)
                    .email(adminEmail)
                    .passwordHash(passwordEncoder.encode(adminPassword))
                    .role(Role.ADMIN)
                    .bio("Forum Administrator")
                    .build();
            userRepository.save(admin);
            log.info("Created default admin user: {}", adminEmail);
        }
    }
}
