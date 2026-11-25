package com.pdi.tracker.repository;

import com.pdi.tracker.model.Assignment;
import com.pdi.tracker.model.AssignmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AssignmentRepository extends JpaRepository<Assignment, Long> {
    List<Assignment> findByLearnerId(Long learnerId);

    boolean existsByLearnerIdAndActivityId(Long learnerId, Long activityId);

    long countByStatus(AssignmentStatus status);

    void deleteByLearnerId(Long learnerId);

    void deleteByActivityId(Long activityId);
}