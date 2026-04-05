package com.forum.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ReportRequest {

    @NotBlank(message = "Target type is required")
    private String targetType; // POST, COMMENT, USER

    @NotBlank(message = "Target ID is required")
    private String targetId;

    @NotBlank(message = "Reason is required")
    @Size(max = 500, message = "Reason must not exceed 500 characters")
    private String reason;
}
