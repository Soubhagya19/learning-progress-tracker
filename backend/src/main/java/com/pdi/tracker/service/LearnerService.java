package com.pdi.tracker.service;

import com.pdi.tracker.dto.LearnerDtos.*;
import com.pdi.tracker.exception.ApiException;
import com.pdi.tracker.model.Account;
import com.pdi.tracker.model.Learner;
import com.pdi.tracker.model.Role;
import com.pdi.tracker.repository.AccountRepository;
import com.pdi.tracker.repository.AssignmentRepository;
import com.pdi.tracker.repository.LearnerRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class LearnerService {
    private static final String CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$";
    private final SecureRandom random = new SecureRandom();

    private final LearnerRepository learnerRepository;
    private final AccountRepository accountRepository;
    private final AssignmentRepository assignmentRepository;
    private final PasswordEncoder passwordEncoder;

    public LearnerService(
            LearnerRepository learnerRepository,
            AccountRepository accountRepository,
            AssignmentRepository assignmentRepository,
            PasswordEncoder passwordEncoder) {
        this.learnerRepository = learnerRepository;
        this.accountRepository = accountRepository;
        this.assignmentRepository = assignmentRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<LearnerResponse> listLearners() {
        return learnerRepository.findAll().stream()
                .map(l -> new LearnerResponse(
                        l.getId(),
                        l.getDisplayName(),
                        l.getAccount().getEmail(),
                        l.getCohort()))
                .toList();
    }

    @Transactional
    public CredentialResponse createCandidate(CreateLearnerRequest req) {
        String normalizedEmail = req.email().trim().toLowerCase();
        if (accountRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new ApiException(HttpStatus.CONFLICT, "An account with this email already exists.");
        }

        String tempPassword = generateTempPassword();
        Instant expiresAt = Instant.now().plus(24, ChronoUnit.HOURS);

        Account account = new Account();
        account.setEmail(normalizedEmail);
        account.setPasswordHash(passwordEncoder.encode(tempPassword));
        account.setRole(Role.CANDIDATE);
        account.setMustChangePassword(true);
        account.setTempPasswordExpiresAt(expiresAt);

        Learner learner = new Learner();
        learner.setDisplayName(req.name().trim());
        learner.setCohort(req.cohort().trim());
        learner.setAccount(account);

        Learner saved = learnerRepository.save(learner);

        return new CredentialResponse(
                saved.getId(),
                saved.getDisplayName(),
                saved.getAccount().getEmail(),
                saved.getCohort(),
                tempPassword,
                expiresAt.toString());
    }

    @Transactional
    public CredentialResponse resetCandidatePassword(Long learnerId) {
        Learner learner = learnerRepository.findById(learnerId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Learner not found."));

        String tempPassword = generateTempPassword();
        Instant expiresAt = Instant.now().plus(24, ChronoUnit.HOURS);

        Account account = learner.getAccount();
        account.setPasswordHash(passwordEncoder.encode(tempPassword));
        account.setMustChangePassword(true);
        account.setTempPasswordExpiresAt(expiresAt);
        accountRepository.save(account);

        return new CredentialResponse(
                learner.getId(),
                learner.getDisplayName(),
                account.getEmail(),
                learner.getCohort(),
                tempPassword,
                expiresAt.toString());
    }

    @Transactional
    public void deleteLearner(Long learnerId) {
        Learner learner = learnerRepository.findById(learnerId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Learner not found."));
        assignmentRepository.deleteByLearnerId(learnerId);
        learnerRepository.delete(learner);
    }

    private String generateTempPassword() {
        StringBuilder sb = new StringBuilder(12);
        for (int i = 0; i < 12; i++) {
            sb.append(CHARS.charAt(random.nextInt(CHARS.length())));
        }
        return sb.toString();
    }
}