package com.pdi.tracker.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AuthDtos {
    public record LoginRequest(
        @NotBlank(message = "Email is required.") @Email(message = "Invalid email format.") String email,
        @NotBlank(message = "Password is required.") String password
    ) {}

    public record LoginResponse(
        String email,
        String role,
        boolean mustChangePassword,
        String displayName
    ) {}

    public record ChangePasswordRequest(
        @NotBlank(message = "Current password is required.") String currentPassword,
        @NotBlank(message = "New password is required.")
        @Size(min = 8, message = "New password must be at least 8 characters.") String newPassword
    ) {}
}
