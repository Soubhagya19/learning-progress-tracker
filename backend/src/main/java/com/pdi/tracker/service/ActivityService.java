package com.pdi.tracker.service;

import com.pdi.tracker.dto.ActivityDtos.*;
import com.pdi.tracker.exception.ApiException;
import com.pdi.tracker.model.Activity;
import com.pdi.tracker.repository.ActivityRepository;
import com.pdi.tracker.repository.AssignmentRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class ActivityService {
    private final ActivityRepository activityRepository;
    private final AssignmentRepository assignmentRepository;

    public ActivityService(ActivityRepository activityRepository, AssignmentRepository assignmentRepository) {
        this.activityRepository = activityRepository;
        this.assignmentRepository = assignmentRepository;
    }

    public List<ActivityResponse> listActivities() {
        return activityRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ActivityResponse createActivity(ActivityRequest req) {
        Activity activity = new Activity();
        activity.setTitle(req.title().trim());
        activity.setTopic(req.topic().trim());
        activity.setPlannedHours(req.plannedHours());
        return toResponse(activityRepository.save(activity));
    }

    @Transactional
    public ActivityResponse updateActivity(Long id, ActivityRequest req) {
        Activity activity = activityRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Activity not found."));
        activity.setTitle(req.title().trim());
        activity.setTopic(req.topic().trim());
        activity.setPlannedHours(req.plannedHours());
        return toResponse(activityRepository.save(activity));
    }

    @Transactional
    public void deleteActivity(Long id) {
        if (!activityRepository.existsById(id)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Activity not found.");
        }
        assignmentRepository.deleteByActivityId(id);
        activityRepository.deleteById(id);
    }

    private ActivityResponse toResponse(Activity a) {
        return new ActivityResponse(a.getId(), a.getTitle(), a.getTopic(), a.getPlannedHours());
    }
}