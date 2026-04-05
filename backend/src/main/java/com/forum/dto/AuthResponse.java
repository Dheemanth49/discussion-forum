package com.forum.dto;

import com.forum.model.Role;
import lombok.*;

import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AuthResponse {
    private String token;
    private UUID userId;
    private String username;
    private String email;
    private Role role;
    private String profileImageUrl;
}
