package com.forum.controller;

import com.forum.dto.UserResponse;
import com.forum.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/profile")
    public ResponseEntity<UserResponse> getProfile(Authentication authentication) {
        return ResponseEntity.ok(userService.getProfile(authentication.getName()));
    }

    @PutMapping("/profile")
    public ResponseEntity<UserResponse> updateProfile(
            Authentication authentication,
            @RequestBody Map<String, String> updates) {
        return ResponseEntity.ok(userService.updateProfile(
                authentication.getName(),
                updates.get("bio"),
                updates.get("profileImageUrl")
        ));
    }

    @PutMapping("/change-password")
    public ResponseEntity<Map<String, String>> changePassword(
            Authentication authentication,
            @RequestBody Map<String, String> passwords) {
        userService.changePassword(
                authentication.getName(),
                passwords.get("oldPassword"),
                passwords.get("newPassword")
        );
        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }
}
