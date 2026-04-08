package com.forum.controller;

import com.forum.dto.ReportResponse;
import com.forum.dto.UserResponse;
import com.forum.model.Category;
import com.forum.service.CategoryService;
import com.forum.service.ModerationService;
import com.forum.service.PostService;
import com.forum.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final ModerationService moderationService;
    private final CategoryService categoryService;
    private final ReportService reportService;
    private final PostService postService;

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> getStats() {
        return ResponseEntity.ok(Map.of(
                "totalUsers", moderationService.getTotalUsers(),
                "totalPosts", moderationService.getTotalPosts(),
                "totalComments", moderationService.getTotalComments(),
                "pendingReports", reportService.getPendingReportCount()
        ));
    }

    @GetMapping("/users")
    public ResponseEntity<Page<UserResponse>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(moderationService.getAllUsers(page, size));
    }

    @PutMapping("/users/{userId}/ban")
    public ResponseEntity<Map<String, String>> banUser(@PathVariable UUID userId) {
        moderationService.banUser(userId);
        return ResponseEntity.ok(Map.of("message", "User banned successfully"));
    }

    @PutMapping("/users/{userId}/unban")
    public ResponseEntity<Map<String, String>> unbanUser(@PathVariable UUID userId) {
        moderationService.unbanUser(userId);
        return ResponseEntity.ok(Map.of("message", "User unbanned successfully"));
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<Void> deleteUser(@PathVariable UUID userId) {
        moderationService.deleteUser(userId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/posts/{postId}")
    public ResponseEntity<Void> deletePost(@PathVariable UUID postId) {
        moderationService.deletePostByAdmin(postId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(@PathVariable UUID commentId) {
        moderationService.deleteCommentByAdmin(commentId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/categories")
    public ResponseEntity<Category> createCategory(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(categoryService.createCategory(
                body.get("name"),
                body.get("description"),
                body.get("iconName")
        ));
    }

    @DeleteMapping("/categories/{categoryId}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long categoryId) {
        categoryService.deleteCategory(categoryId);
        return ResponseEntity.noContent().build();
    }

    // ===== Report Management =====

    @GetMapping("/reports")
    public ResponseEntity<Page<ReportResponse>> getReports(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status) {
        if (status != null && !status.isEmpty()) {
            return ResponseEntity.ok(reportService.getReportsByStatus(status, page, size));
        }
        return ResponseEntity.ok(reportService.getAllReports(page, size));
    }

    @PutMapping("/reports/{reportId}")
    public ResponseEntity<Map<String, String>> updateReportStatus(
            @PathVariable UUID reportId,
            @RequestBody Map<String, String> body) {
        reportService.updateReportStatus(reportId, body.get("status"));
        return ResponseEntity.ok(Map.of("message", "Report updated"));
    }

    @DeleteMapping("/reports/{reportId}")
    public ResponseEntity<Void> deleteReport(@PathVariable UUID reportId) {
        reportService.deleteReport(reportId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/reembed-all-posts")
    public ResponseEntity<Map<String, Object>> reembedAllPosts() {
        long count = postService.triggerReembedAllPosts();
        return ResponseEntity.ok(Map.of("message", "Embedding triggered for all posts", "count", count));
    }
}
