package com.forum.controller;

import com.forum.dto.ReportRequest;
import com.forum.dto.ReportResponse;
import com.forum.model.Post;
import com.forum.model.User;
import com.forum.repository.CommentRepository;
import com.forum.repository.PostRepository;
import com.forum.service.ReportService;
import com.forum.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@Slf4j
public class ReportController {

    private final ReportService reportService;
    private final UserService userService;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;

    @PostMapping
    public ResponseEntity<ReportResponse> createReport(
            @Valid @RequestBody ReportRequest request,
            Authentication authentication) {
        User reporter = userService.getUserByEmail(authentication.getName());

        String targetTitle = null;
        String targetAuthor = null;
        String targetAuthorId = null;

        try {
            if ("POST".equals(request.getTargetType())) {
                Post post = postRepository.findById(UUID.fromString(request.getTargetId())).orElse(null);
                if (post != null) {
                    targetTitle = post.getTitle();
                    targetAuthor = post.getAuthor().getUsername();
                    targetAuthorId = post.getAuthor().getUserId().toString();
                }
            } else if ("COMMENT".equals(request.getTargetType())) {
                var comment = commentRepository.findById(UUID.fromString(request.getTargetId())).orElse(null);
                if (comment != null) {
                    targetTitle = comment.getContent().length() > 100
                            ? comment.getContent().substring(0, 100) + "..."
                            : comment.getContent();
                    targetAuthor = comment.getAuthor().getUsername();
                    targetAuthorId = comment.getAuthor().getUserId().toString();
                }
            } else if ("USER".equals(request.getTargetType())) {
                try {
                    var user = userService.getUserById(UUID.fromString(request.getTargetId()));
                    targetAuthor = user.getUsername();
                    targetAuthorId = user.getUserId().toString();
                } catch (Exception e) {
                    targetAuthor = request.getTargetId();
                    log.warn("Failed to find reported user by ID: {}", request.getTargetId(), e);
                }
            }
        } catch (Exception e) {
            log.error("Error fetching report target info: ", e);
        }

        return ResponseEntity.ok(reportService.createReport(request, reporter, targetTitle, targetAuthor, targetAuthorId));
    }

    @GetMapping("/check")
    public ResponseEntity<Map<String, Boolean>> checkIfReported(
            @RequestParam String targetType,
            @RequestParam String targetId,
            Authentication authentication) {
        User reporter = userService.getUserByEmail(authentication.getName());
        boolean reported = reportService.hasUserReported(reporter.getUserId(), targetType, targetId);
        return ResponseEntity.ok(Map.of("reported", reported));
    }
}
