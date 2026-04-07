package com.forum.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import org.hibernate.annotations.UuidGenerator;


import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "reports")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Report {

    @Id
    @UuidGenerator(style = UuidGenerator.Style.TIME)
    @Column(name = "report_id")
    private UUID reportId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private User reporter;

    @Column(name = "target_type", nullable = false)
    private String targetType; // POST, COMMENT, USER

    @Column(name = "target_id", nullable = false)
    private String targetId;

    @Column(nullable = false, length = 500)
    private String reason;

    @Column(name = "target_title")
    private String targetTitle;

    @Column(name = "target_author")
    private String targetAuthor;

    @Column(name = "target_author_id")
    private String targetAuthorId;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "PENDING"; // PENDING, REVIEWED, DISMISSED

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
