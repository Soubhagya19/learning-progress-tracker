package com.pdi.tracker.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class LearnerDtos {
    public record CreateLearnerRequest(
        @NotBlank(message = "Name is required.") String name,
        @NotBlank(message = "Email is required.") @Email(message = "Valid email is required.") String email,
        @NotBlank(message = "Cohort is required.") String cohort
    ) {}

    public record LearnerResponse(
        Long id,
        String displayName,
        String email,
        String cohort
    ) {}

    public record CredentialResponse(
        Long learnerId,
        String displayName,
        String email,
        String cohort,
        String temporaryPassword,
        String expiresAt
    ) {}
}
