package com.pdi.tracker.controller;

import com.pdi.tracker.dto.AssignmentDtos.*;
import com.pdi.tracker.security.CustomUserDetails;
import com.pdi.tracker.service.AssignmentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1")
public class AssignmentController {
    private final AssignmentService assignmentService;

    public AssignmentController(AssignmentService assignmentService) {
        this.assignmentService = assignmentService;
    }

    @PostMapping("/assignments")
    public ResponseEntity<AssignmentResponse> create(@Valid @RequestBody CreateAssignmentRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(assignmentService.assignActivity(req));
    }

    @PatchMapping("/assignments/{id}/status")
    public AssignmentResponse updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateStatusRequest req,
            @AuthenticationPrincipal CustomUserDetails details
    ) {
        return assignmentService.updateStatus(id, req, details.getAccount());
    }

    @GetMapping("/me/assignments")
    public List<AssignmentResponse> myAssignments(@AuthenticationPrincipal CustomUserDetails details) {
        return assignmentService.getMyAssignments(details.getAccount());
    }

    @GetMapping("/cohort-summary")
    public CohortSummaryResponse cohortSummary() {
        return assignmentService.getCohortSummary();
    }
}
