package com.platform.orderfleet.catalog.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record CreateProductRequest(
    @NotBlank(message = "SKU is required")
    @Size(max = 50, message = "SKU cannot exceed 50 characters")
    String sku,

    @NotBlank(message = "Product title is required")
    @Size(max = 150, message = "Product title cannot exceed 150 characters")
    String title,

    @Size(max = 1000, message = "Description cannot exceed 1000 characters")
    String description,

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.01", message = "Price must be greater than zero")
    BigDecimal price,

    Long categoryId,

    @Min(value = 0, message = "Initial stock cannot be negative")
    int initialStock
) {}
