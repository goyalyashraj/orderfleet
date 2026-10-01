package com.platform.orderfleet.identity.dto;

import java.time.Instant;
import java.util.List;

public record UserProfileResponse(
    Long id,
    String email,
    String firstName,
    String lastName,
    String phone,
    String status,
    List<String> roles,
    Instant createdAt
) {}
