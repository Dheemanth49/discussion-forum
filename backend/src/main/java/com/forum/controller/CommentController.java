package com.forum.controller;

import com.forum.dto.CommentRequest;
import com.forum.dto.CommentResponse;
import com.forum.model.User;
import com.forum.service.CommentService;
import com.forum.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/posts/{postId}/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;
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
    public ResponseEntity<List<CommentResponse>> getComments(
            @PathVariable UUID postId,
            Authentication authentication) {
        return ResponseEntity.ok(commentService.getCommentsByPostId(postId, getCurrentUser(authentication)));
    }

    @PostMapping
    public ResponseEntity<CommentResponse> addComment(
            @PathVariable UUID postId,
            @Valid @RequestBody CommentRequest request,
            Authentication authentication) {
        User user = userService.getUserByEmail(authentication.getName());
        return ResponseEntity.ok(commentService.addComment(postId, request, user));
    }

    @PostMapping("/{commentId}/vote")
    public ResponseEntity<CommentResponse> voteComment(
            @PathVariable UUID postId,
            @PathVariable UUID commentId,
            @RequestParam boolean upvote,
            Authentication authentication) {
        User user = userService.getUserByEmail(authentication.getName());
        return ResponseEntity.ok(commentService.voteComment(commentId, upvote, user));
    }

    @DeleteMapping("/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable UUID postId,
            @PathVariable UUID commentId,
            Authentication authentication) {
        User user = userService.getUserByEmail(authentication.getName());
        commentService.deleteComment(commentId, user);
        return ResponseEntity.noContent().build();
    }
}
