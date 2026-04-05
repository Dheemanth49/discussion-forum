package com.forum.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ReportResponse {
    private UUID reportId;
    private String reporterUsername;
    private UUID reporterId;
    private String targetType;
    private String targetId;
    private String targetTitle;
    private String targetAuthor;
    private String targetAuthorId;
    private String reason;
    private String status;
    private LocalDateTime createdAt;
}
