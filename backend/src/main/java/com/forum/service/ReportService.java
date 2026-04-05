package com.forum.service;

import com.forum.dto.ReportRequest;
import com.forum.dto.ReportResponse;
import com.forum.model.Report;
import com.forum.model.User;
import com.forum.repository.ReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final ReportRepository reportRepository;

    public ReportResponse createReport(ReportRequest request, User reporter,
                                        String targetTitle, String targetAuthor, String targetAuthorId) {
        // Check for duplicate reports
        if (reportRepository.existsByReporterUserIdAndTargetTypeAndTargetId(
                reporter.getUserId(), request.getTargetType(), request.getTargetId())) {
            throw new RuntimeException("You have already reported this content");
        }

        Report report = Report.builder()
                .reporter(reporter)
                .targetType(request.getTargetType())
                .targetId(request.getTargetId())
                .reason(request.getReason())
                .targetTitle(targetTitle)
                .targetAuthor(targetAuthor)
                .targetAuthorId(targetAuthorId)
                .build();

        report = reportRepository.save(report);
        return mapToResponse(report);
    }

    public Page<ReportResponse> getAllReports(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return reportRepository.findAllByOrderByCreatedAtDesc(pageable).map(this::mapToResponse);
    }

    public Page<ReportResponse> getReportsByStatus(String status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return reportRepository.findByStatusOrderByCreatedAtDesc(status, pageable).map(this::mapToResponse);
    }

    public void updateReportStatus(UUID reportId, String status) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Report not found"));
        report.setStatus(status);
        reportRepository.save(report);
    }

    public void deleteReport(UUID reportId) {
        reportRepository.deleteById(reportId);
    }

    public boolean hasUserReported(UUID reporterId, String targetType, String targetId) {
        return reportRepository.existsByReporterUserIdAndTargetTypeAndTargetId(reporterId, targetType, targetId);
    }

    public long getPendingReportCount() {
        return reportRepository.countByStatus("PENDING");
    }

    private ReportResponse mapToResponse(Report report) {
        return ReportResponse.builder()
                .reportId(report.getReportId())
                .reporterUsername(report.getReporter().getUsername())
                .reporterId(report.getReporter().getUserId())
                .targetType(report.getTargetType())
                .targetId(report.getTargetId())
                .targetTitle(report.getTargetTitle())
                .targetAuthor(report.getTargetAuthor())
                .targetAuthorId(report.getTargetAuthorId())
                .reason(report.getReason())
                .status(report.getStatus())
                .createdAt(report.getCreatedAt())
                .build();
    }
}
