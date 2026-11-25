package com.pdi.tracker.service;

import com.pdi.tracker.dto.AssignmentDtos.*;
import com.pdi.tracker.exception.ApiException;
import com.pdi.tracker.model.*;
import com.pdi.tracker.repository.ActivityRepository;
import com.pdi.tracker.repository.AssignmentRepository;
import com.pdi.tracker.repository.LearnerRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class AssignmentService {
    private final AssignmentRepository assignmentRepository;
    private final LearnerRepository learnerRepository;
    private final ActivityRepository activityRepository;

    public AssignmentService(
            AssignmentRepository assignmentRepository,
            LearnerRepository learnerRepository,
            ActivityRepository activityRepository
    ) {
        this.assignmentRepository = assignmentRepository;
        this.learnerRepository = learnerRepository;
        this.activityRepository = activityRepository;
    }

    public List<AssignmentResponse> getAssignmentsForLearner(Long learnerId) {
        if (!learnerRepository.existsById(learnerId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Learner not found.");
        }
        return assignmentRepository.findByLearnerId(learnerId).stream()
                .map(this::toResponse)
                .toList();
    }

    public List<AssignmentResponse> getMyAssignments(Account candidateAccount) {
        Learner learner = learnerRepository.findByAccountId(candidateAccount.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Candidate profile not found."));
        return assignmentRepository.findByLearnerId(learner.getId()).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public AssignmentResponse assignActivity(CreateAssignmentRequest req) {
        Learner learner = learnerRepository.findById(req.learnerId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Learner not found."));
        Activity activity = activityRepository.findById(req.activityId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Activity not found."));

        if (assignmentRepository.existsByLearnerIdAndActivityId(learner.getId(), activity.getId())) {
            throw new ApiException(HttpStatus.CONFLICT, "Assignment already exists.");
        }

        Assignment assignment = new Assignment();
        assignment.setLearner(learner);
        assignment.setActivity(activity);
        assignment.setStatus(AssignmentStatus.NOT_STARTED);

        return toResponse(assignmentRepository.save(assignment));
    }

    @Transactional
    public AssignmentResponse updateStatus(Long assignmentId, UpdateStatusRequest req, Account caller) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Assignment not found."));

        if (caller.getRole() == Role.CANDIDATE) {
            if (!assignment.getLearner().getAccount().getId().equals(caller.getId())) {
                throw new ApiException(HttpStatus.FORBIDDEN, "You can only update your own training.");
            }
        }

        AssignmentStatus newStatus = AssignmentStatus.fromValue(req.status());

        if (req.certificateName() != null && !req.certificateName().isBlank()
                && req.certificateData() != null && !req.certificateData().isBlank()) {
            if (req.certificateData().length() > 7_500_000) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Certificate file exceeds the 5 MB limit.");
            }
            assignment.setCertificateName(req.certificateName().trim());
            assignment.setCertificateData(req.certificateData());
        }

        if (newStatus == AssignmentStatus.COMPLETED && caller.getRole() == Role.CANDIDATE) {
            if (assignment.getCertificateData() == null || assignment.getCertificateData().isBlank()) {
                throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Please upload your completion certificate before marking this course as Completed."
                );
            }
        }

        assignment.setStatus(newStatus);
        return toResponse(assignmentRepository.save(assignment));
    }

    public CohortSummaryResponse getCohortSummary() {
        long learners = learnerRepository.count();
        long assignments = assignmentRepository.count();
        long completed = assignmentRepository.countByStatus(AssignmentStatus.COMPLETED);
        return new CohortSummaryResponse(learners, assignments, completed);
    }

    private AssignmentResponse toResponse(Assignment a) {
        return new AssignmentResponse(
                a.getId(),
                a.getLearner().getId(),
                a.getActivity().getId(),
                a.getActivity().getTitle(),
                a.getActivity().getTopic(),
                a.getActivity().getPlannedHours(),
                a.getStatus().getLabel(),
                a.getCertificateName(),
                a.getCertificateData()
        );
    }
}