package com.forum.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PostResponse {
    private UUID postId;
    private String title;
    private String content;
    private String authorUsername;
    private UUID authorId;
    private String authorImageUrl;
    private String categoryName;
    private Long categoryId;
    private int upvotes;
    private int downvotes;
    private int viewCount;
    private int commentCount;
    private String mediaUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // User-specific fields (null when not authenticated)
    private Integer userVote; // 1 = upvoted, -1 = downvoted, null = not voted
    private Boolean isSaved;  // true if current user saved this post
}
