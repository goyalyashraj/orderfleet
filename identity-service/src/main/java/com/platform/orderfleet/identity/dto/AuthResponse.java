package com.platform.orderfleet.identity.dto;

import java.util.List;

public record AuthResponse(
    String accessToken,
    String tokenType,
    long expiresIn,
    Long userId,
    String email,
    List<String> roles
) {
    public static AuthResponse of(String accessToken, long expiresIn, Long userId, String email, List<String> roles) {
        return new AuthResponse(accessToken, "Bearer", expiresIn, userId, email, roles);
    }
}
