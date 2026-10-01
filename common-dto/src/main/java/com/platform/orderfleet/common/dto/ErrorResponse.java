package com.platform.orderfleet.common.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;
import java.util.Map;

/**
 * Standard structured error payload for all microservices.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErrorResponse(
    int status,
    String error,
    String message,
    String path,
    Instant timestamp,
    Map<String, String> validationErrors
) {
    public static ErrorResponse of(int status, String error, String message, String path) {
        return new ErrorResponse(status, error, message, path, Instant.now(), null);
    }

    public static ErrorResponse withValidation(int status, String error, String message, String path, Map<String, String> validationErrors) {
        return new ErrorResponse(status, error, message, path, Instant.now(), validationErrors);
    }
}
