package com.pdi.tracker.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public class ActivityDtos {
    public record ActivityRequest(
        @NotBlank(message = "Title is required.") String title,
        @NotBlank(message = "Topic is required.") String topic,
        @NotNull(message = "Planned hours is required.")
        @Positive(message = "Planned hours must be greater than zero.") Integer plannedHours
    ) {}

    public record ActivityResponse(
        Long id,
        String title,
        String topic,
        Integer plannedHours
    ) {}
}
