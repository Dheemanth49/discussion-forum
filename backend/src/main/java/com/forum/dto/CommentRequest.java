package com.forum.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class CommentRequest {

    @NotBlank(message = "Comment content is required")
    private String content;

    private UUID parentCommentId;
}
