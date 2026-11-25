package com.pdi.tracker.controller;

import com.pdi.tracker.dto.AssignmentDtos.AssignmentResponse;
import com.pdi.tracker.dto.LearnerDtos.*;
import com.pdi.tracker.service.AssignmentService;
import com.pdi.tracker.service.LearnerService;
import jakarta.validation.Valid;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/learners")
public class LearnerController {
    private final LearnerService learnerService;
    private final AssignmentService assignmentService;

    public LearnerController(LearnerService learnerService, AssignmentService assignmentService) {
        this.learnerService = learnerService;
        this.assignmentService = assignmentService;
    }

    @GetMapping
    public List<LearnerResponse> list() {
        return learnerService.listLearners();
    }

    @PostMapping
    public ResponseEntity<CredentialResponse> create(@Valid @RequestBody CreateLearnerRequest req) {
        CredentialResponse creds = learnerService.createCandidate(req);
        return ResponseEntity.status(HttpStatus.CREATED)
                .cacheControl(CacheControl.noStore())
                .body(creds);
    }

    @PostMapping("/{id}/reset-password")
    public ResponseEntity<CredentialResponse> resetPassword(@PathVariable Long id) {
        CredentialResponse creds = learnerService.resetCandidatePassword(id);
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(creds);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        learnerService.deleteLearner(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/assignments")
    public List<AssignmentResponse> getLearnerAssignments(@PathVariable Long id) {
        return assignmentService.getAssignmentsForLearner(id);
    }
}