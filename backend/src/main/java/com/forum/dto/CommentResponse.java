package com.forum.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CommentResponse {
    private UUID commentId;
    private String content;
    private String authorUsername;
    private UUID authorId;
    private String authorImageUrl;
    private int upvotes;
    private LocalDateTime createdAt;

    // User-specific field
    private Integer userVote; // 1 = upvoted, -1 = downvoted, null = not voted

    @Builder.Default
    private List<CommentResponse> replies = new ArrayList<>();
}
