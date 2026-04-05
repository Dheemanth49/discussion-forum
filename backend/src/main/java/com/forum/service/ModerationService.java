package com.forum.service;

import com.forum.dto.UserResponse;
import com.forum.model.User;
import com.forum.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class ModerationService {

    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final VoteRepository voteRepository;
    private final ReportRepository reportRepository;
    private final SavedPostRepository savedPostRepository;

    public Page<UserResponse> getAllUsers(int page, int size) {
        return userRepository.findAll(PageRequest.of(page, size, Sort.by("createdAt").descending()))
                .map(this::mapToResponse);
    }

    public void banUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setBanned(true);
        userRepository.save(user);
    }

    public void unbanUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setBanned(false);
        userRepository.save(user);
    }

    public void deleteUser(UUID userId) {
        // Sequentially wipe dependencies to avoid FK violations
        
        // 1. Delete votes made BY this user
        voteRepository.deleteByUserUserId(userId);
        
        // 2. Delete votes made ON this user's content (Posts & Comments)
        voteRepository.deleteVotesOnUserPosts(userId);
        voteRepository.deleteVotesOnUserComments(userId);
        
        // 3. Delete saves made BY this user
        savedPostRepository.deleteByUserUserId(userId);
        
        // 4. Delete saves made ON this user's posts
        savedPostRepository.deleteSavesOnUserPosts(userId);
        
        // 5. Delete reports made BY this user
        reportRepository.deleteByReporterUserId(userId);
        
        // 6. Delete comments made BY this user
        commentRepository.deleteByAuthorUserId(userId);
        
        // 7. Delete posts made BY this user (will cascade to delete comments ON those posts)
        postRepository.deleteByAuthorUserId(userId);
        
        // 8. Finally delete the user
        userRepository.deleteById(userId);
    }

    public void deletePostByAdmin(UUID postId) {
        postRepository.deleteById(postId);
    }

    public void deleteCommentByAdmin(UUID commentId) {
        commentRepository.deleteById(commentId);
    }

    public long getTotalUsers() { return userRepository.count(); }
    public long getTotalPosts() { return postRepository.count(); }
    public long getTotalComments() { return commentRepository.count(); }

    private UserResponse mapToResponse(User user) {
        return UserResponse.builder()
                .userId(user.getUserId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole().name())
                .bio(user.getBio())
                .profileImageUrl(user.getProfileImageUrl())
                .isBanned(user.isBanned())
                .createdAt(user.getCreatedAt())
                .postCount(postRepository.countByAuthorUserId(user.getUserId()))
                .commentCount(commentRepository.countByAuthorUserId(user.getUserId()))
                .build();
    }
}
