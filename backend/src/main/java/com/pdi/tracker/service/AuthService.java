package com.pdi.tracker.service;

import com.pdi.tracker.dto.AuthDtos.*;
import com.pdi.tracker.exception.ApiException;
import com.pdi.tracker.model.Account;
import com.pdi.tracker.model.Learner;
import com.pdi.tracker.model.Role;
import com.pdi.tracker.repository.AccountRepository;
import com.pdi.tracker.repository.LearnerRepository;
import com.pdi.tracker.security.CustomUserDetails;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.CredentialsExpiredException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private final AuthenticationManager authenticationManager;
    private final AccountRepository accountRepository;
    private final LearnerRepository learnerRepository;
    private final PasswordEncoder passwordEncoder;
    private final SecurityContextRepository securityContextRepository;

    public AuthService(
            AuthenticationManager authenticationManager,
            AccountRepository accountRepository,
            LearnerRepository learnerRepository,
            PasswordEncoder passwordEncoder,
            SecurityContextRepository securityContextRepository
    ) {
        this.authenticationManager = authenticationManager;
        this.accountRepository = accountRepository;
        this.learnerRepository = learnerRepository;
        this.passwordEncoder = passwordEncoder;
        this.securityContextRepository = securityContextRepository;
    }

    public LoginResponse login(LoginRequest req, HttpServletRequest request, HttpServletResponse response) {
        try {
            Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.email().trim().toLowerCase(), req.password())
            );
            SecurityContext context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(auth);
            SecurityContextHolder.setContext(context);
            securityContextRepository.saveContext(context, request, response);

            CustomUserDetails details = (CustomUserDetails) auth.getPrincipal();
            return buildSessionResponse(details.getAccount());
        } catch (CredentialsExpiredException e) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Temporary credentials have expired. Ask your coordinator for a reset.");
        } catch (BadCredentialsException e) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password.");
        }
    }

    public LoginResponse getCurrentUser(Account account) {
        Account fresh = accountRepository.findById(account.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Session invalid."));
        return buildSessionResponse(fresh);
    }

    @Transactional
    public void changePassword(Account principalAccount, ChangePasswordRequest req, HttpServletRequest request, HttpServletResponse response) {
        Account account = accountRepository.findById(principalAccount.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Account not found."));

        if (!passwordEncoder.matches(req.currentPassword(), account.getPasswordHash())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Current password is incorrect.");
        }
        if (req.currentPassword().equals(req.newPassword())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "New password must differ from current password.");
        }

        account.setPasswordHash(passwordEncoder.encode(req.newPassword()));
        account.setMustChangePassword(false);
        account.setTempPasswordExpiresAt(null);
        accountRepository.save(account);

        request.changeSessionId();
        CustomUserDetails updatedDetails = new CustomUserDetails(account);
        Authentication newAuth = new UsernamePasswordAuthenticationToken(updatedDetails, null, updatedDetails.getAuthorities());
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(newAuth);
        SecurityContextHolder.setContext(context);
        securityContextRepository.saveContext(context, request, response);
    }

    public void logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        SecurityContextHolder.clearContext();
    }

    private LoginResponse buildSessionResponse(Account account) {
        String displayName = account.getRole() == Role.COORDINATOR
                ? "Cohort Coordinator"
                : learnerRepository.findByAccountId(account.getId()).map(Learner::getDisplayName).orElse("Candidate");

        return new LoginResponse(
                account.getEmail(),
                account.getRole().name(),
                account.isMustChangePassword(),
                displayName
        );
    }
}
