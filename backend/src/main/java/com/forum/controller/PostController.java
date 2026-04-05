package com.forum.controller;

import com.forum.dto.PostRequest;
import com.forum.dto.PostResponse;
import com.forum.model.User;
import com.forum.service.PostService;
import com.forum.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;
    private final UserService userService;

    private User getCurrentUser(Authentication auth) {
        if (auth == null || auth.getName() == null) return null;
        try {
            return userService.getUserByEmail(auth.getName());
        } catch (Exception e) {
            return null;
        }
    }

    @GetMapping
    public ResponseEntity<Page<PostResponse>> getAllPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "latest") String sort,
            Authentication authentication) {
        return ResponseEntity.ok(postService.getAllPosts(page, size, sort, getCurrentUser(authentication)));
    }

    @GetMapping("/{postId}")
    public ResponseEntity<PostResponse> getPostById(@PathVariable UUID postId, Authentication authentication) {
        return ResponseEntity.ok(postService.getPostById(postId, getCurrentUser(authentication)));
    }

    @GetMapping("/category/{categoryId}")
    public ResponseEntity<Page<PostResponse>> getPostsByCategory(
            @PathVariable Long categoryId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {
        return ResponseEntity.ok(postService.getPostsByCategory(categoryId, page, size, getCurrentUser(authentication)));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<Page<PostResponse>> getPostsByUser(
            @PathVariable UUID userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {
        return ResponseEntity.ok(postService.getPostsByUser(userId, page, size, getCurrentUser(authentication)));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<PostResponse>> searchPosts(
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {
        return ResponseEntity.ok(postService.searchPosts(q, page, size, getCurrentUser(authentication)));
    }

    @GetMapping("/trending")
    public ResponseEntity<Page<PostResponse>> getTrendingPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size,
            Authentication authentication) {
        return ResponseEntity.ok(postService.getTrendingPosts(page, size, getCurrentUser(authentication)));
    }

    @GetMapping("/unanswered")
    public ResponseEntity<Page<PostResponse>> getUnansweredPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {
        return ResponseEntity.ok(postService.getUnansweredPosts(page, size, getCurrentUser(authentication)));
    }

    @PostMapping
    public ResponseEntity<PostResponse> createPost(
            @Valid @RequestBody PostRequest request,
            Authentication authentication) {
        User user = userService.getUserByEmail(authentication.getName());
        return ResponseEntity.ok(postService.createPost(request, user));
    }

    @PutMapping("/{postId}")
    public ResponseEntity<PostResponse> updatePost(
            @PathVariable UUID postId,
            @Valid @RequestBody PostRequest request,
            Authentication authentication) {
        User user = userService.getUserByEmail(authentication.getName());
        return ResponseEntity.ok(postService.updatePost(postId, request, user));
    }

    @DeleteMapping("/{postId}")
    public ResponseEntity<Void> deletePost(
            @PathVariable UUID postId,
            Authentication authentication) {
        User user = userService.getUserByEmail(authentication.getName());
        postService.deletePost(postId, user);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{postId}/vote")
    public ResponseEntity<PostResponse> votePost(
            @PathVariable UUID postId,
            @RequestParam boolean upvote,
            Authentication authentication) {
        User user = userService.getUserByEmail(authentication.getName());
        return ResponseEntity.ok(postService.votePost(postId, upvote, user));
    }

    @PostMapping("/{postId}/save")
    public ResponseEntity<PostResponse> toggleSavePost(
            @PathVariable UUID postId,
            Authentication authentication) {
        User user = userService.getUserByEmail(authentication.getName());
        return ResponseEntity.ok(postService.toggleSavePost(postId, user));
    }

    @GetMapping("/saved")
    public ResponseEntity<Page<PostResponse>> getSavedPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication) {
        User user = userService.getUserByEmail(authentication.getName());
        return ResponseEntity.ok(postService.getSavedPosts(user, page, size));
    }
}
