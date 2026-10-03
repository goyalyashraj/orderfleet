package com.platform.orderfleet.catalog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateCategoryRequest(
    @NotBlank(message = "Category name is required")
    @Size(max = 80, message = "Category name cannot exceed 80 characters")
    String name,

    @NotBlank(message = "Category slug is required")
    @Size(max = 100, message = "Slug cannot exceed 100 characters")
    String slug,

    @Size(max = 500, message = "Description cannot exceed 500 characters")
    String description
) {}
