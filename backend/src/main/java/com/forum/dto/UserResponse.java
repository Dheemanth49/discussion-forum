package com.forum.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserResponse {
    private UUID userId;
    private String username;
    private String email;
    private String role;
    private String bio;
    private String profileImageUrl;
    private boolean isBanned;
    private LocalDateTime createdAt;
    private long postCount;
    private long commentCount;
}
