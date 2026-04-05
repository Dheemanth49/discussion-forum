package com.forum.repository;

import com.forum.model.Report;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ReportRepository extends JpaRepository<Report, UUID> {

    Page<Report> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);

    Page<Report> findAllByOrderByCreatedAtDesc(Pageable pageable);

    long countByStatus(String status);

    boolean existsByReporterUserIdAndTargetTypeAndTargetId(UUID reporterId, String targetType, String targetId);

    void deleteByReporterUserId(UUID userId);
}
