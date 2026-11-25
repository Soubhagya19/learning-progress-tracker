package com.pdi.tracker.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.pdi.tracker.exception.ApiException;
import org.springframework.http.HttpStatus;

public enum AssignmentStatus {
    NOT_STARTED("Not Started"),
    IN_PROGRESS("In Progress"),
    COMPLETED("Completed");

    private final String label;

    AssignmentStatus(String label) {
        this.label = label;
    }

    @JsonValue
    public String getLabel() {
        return label;
    }

    @JsonCreator
    public static AssignmentStatus fromValue(String value) {
        for (AssignmentStatus status : values()) {
            if (status.label.equalsIgnoreCase(value) || status.name().equalsIgnoreCase(value)) {
                return status;
            }
        }
        throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid status. Allowed: Not Started, In Progress, Completed.");
    }
}
