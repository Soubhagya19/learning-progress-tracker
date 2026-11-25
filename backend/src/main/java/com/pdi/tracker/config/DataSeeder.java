package com.pdi.tracker.config;

import com.pdi.tracker.model.*;
import com.pdi.tracker.repository.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements CommandLineRunner {
    private final AccountRepository accountRepository;
    private final LearnerRepository learnerRepository;
    private final ActivityRepository activityRepository;
    private final AssignmentRepository assignmentRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.coordinator.email}")
    private String coordinatorEmail;

    @Value("${app.coordinator.password}")
    private String coordinatorPassword;

    public DataSeeder(
            AccountRepository accountRepository,
            LearnerRepository learnerRepository,
            ActivityRepository activityRepository,
            AssignmentRepository assignmentRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.accountRepository = accountRepository;
        this.learnerRepository = learnerRepository;
        this.activityRepository = activityRepository;
        this.assignmentRepository = assignmentRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (accountRepository.count() > 0) return;

        Account coord = new Account();
        coord.setEmail(coordinatorEmail);
        coord.setPasswordHash(passwordEncoder.encode(coordinatorPassword));
        coord.setRole(Role.COORDINATOR);
        coord.setMustChangePassword(false);
        accountRepository.save(coord);

        Activity a1 = saveActivity("React Basics", "Frontend", 6);
        Activity a2 = saveActivity("REST APIs", "Backend", 8);
        Activity a3 = saveActivity("SQL Foundations", "Data", 4);
        saveActivity("Spring Security Essentials", "Security", 5);

        Learner l1 = saveLearner("Jordan Lee", "jordan.lee@example.test", "Cohort Alpha", "DemoUser123!");
        Learner l2 = saveLearner("Priya Patel", "priya.patel@example.test", "Cohort Alpha", "DemoUser123!");
        saveLearner("Mateo Silva", "mateo.silva@example.test", "Cohort Alpha", "DemoUser123!");

        saveAssignment(l1, a1, AssignmentStatus.IN_PROGRESS);
        saveAssignment(l1, a2, AssignmentStatus.NOT_STARTED);
        saveAssignment(l2, a3, AssignmentStatus.COMPLETED);
    }

    private Activity saveActivity(String title, String topic, int hours) {
        Activity a = new Activity();
        a.setTitle(title);
        a.setTopic(topic);
        a.setPlannedHours(hours);
        return activityRepository.save(a);
    }

    private Learner saveLearner(String name, String email, String cohort, String rawPassword) {
        Account acc = new Account();
        acc.setEmail(email);
        acc.setPasswordHash(passwordEncoder.encode(rawPassword));
        acc.setRole(Role.CANDIDATE);
        acc.setMustChangePassword(false);

        Learner l = new Learner();
        l.setDisplayName(name);
        l.setCohort(cohort);
        l.setAccount(acc);
        return learnerRepository.save(l);
    }

    private void saveAssignment(Learner l, Activity a, AssignmentStatus status) {
        Assignment asg = new Assignment();
        asg.setLearner(l);
        asg.setActivity(a);
        asg.setStatus(status);
        assignmentRepository.save(asg);
    }
}
