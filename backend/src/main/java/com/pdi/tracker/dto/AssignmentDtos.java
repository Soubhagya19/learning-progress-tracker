package com.pdi.tracker.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class AssignmentDtos {
    public record CreateAssignmentRequest(
        @NotNull(message = "learnerId is required.") Long learnerId,
        @NotNull(message = "activityId is required.") Long activityId
    ) {}

    public record UpdateStatusRequest(
        @NotBlank(message = "status is required.") String status
    ) {}

    public record AssignmentResponse(
        Long id,
        Long learnerId,
        Long activityId,
        String activityTitle,
        String activityTopic,
        Integer plannedHours,
        String status
    ) {}

    public record CohortSummaryResponse(
        long totalLearners,
        long totalAssignments,
        long completedAssignments
    ) {}
}
