package com.platform.orderfleet.catalog.controller;

import com.platform.orderfleet.catalog.dto.CategoryResponse;
import com.platform.orderfleet.catalog.dto.CreateCategoryRequest;
import com.platform.orderfleet.catalog.service.CatalogService;
import com.platform.orderfleet.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/categories")
@Tag(name = "Product Categories", description = "Endpoints for category taxonomy management")
public class CategoryController {

    private final CatalogService catalogService;

    public CategoryController(CatalogService catalogService) {
        this.catalogService = catalogService;
    }

    @PostMapping
    @Operation(summary = "Create a product category", description = "Admin endpoint to persist a new category dynamically")
    public ResponseEntity<ApiResponse<CategoryResponse>> createCategory(@Valid @RequestBody CreateCategoryRequest request) {
        CategoryResponse response = catalogService.createCategory(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(response, "Category created successfully"));
    }

    @GetMapping
    @Operation(summary = "List all categories", description = "Public endpoint to retrieve category taxonomy")
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getAllCategories() {
        List<CategoryResponse> categories = catalogService.getAllCategories();
        return ResponseEntity.ok(ApiResponse.success(categories));
    }
}
