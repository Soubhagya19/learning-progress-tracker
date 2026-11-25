package com.pdi.tracker.controller;

import com.pdi.tracker.dto.AuthDtos.*;
import com.pdi.tracker.security.CustomUserDetails;
import com.pdi.tracker.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest req,
            HttpServletRequest request,
            HttpServletResponse response,
            CsrfToken csrfToken
    ) {
        if (csrfToken != null) {
            csrfToken.getToken();
        }
        return ResponseEntity.ok(authService.login(req, request, response));
    }

    @GetMapping("/me")
    public ResponseEntity<LoginResponse> me(
            @AuthenticationPrincipal CustomUserDetails details,
            CsrfToken csrfToken
    ) {
        if (csrfToken != null) {
            csrfToken.getToken();
        }
        return ResponseEntity.ok(authService.getCurrentUser(details.getAccount()));
    }

    @PostMapping("/change-password")
    public ResponseEntity<Void> changePassword(
            @AuthenticationPrincipal CustomUserDetails details,
            @Valid @RequestBody ChangePasswordRequest req,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        authService.changePassword(details.getAccount(), req, request, response);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        authService.logout(request);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }
}
