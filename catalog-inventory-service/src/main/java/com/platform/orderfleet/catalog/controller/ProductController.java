package com.platform.orderfleet.catalog.controller;

import com.platform.orderfleet.catalog.dto.CreateProductRequest;
import com.platform.orderfleet.catalog.dto.ProductResponse;
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
@RequestMapping("/api/v1/products")
@Tag(name = "Product Catalog", description = "Endpoints for managing and browsing dynamic products")
public class ProductController {

    private final CatalogService catalogService;

    public ProductController(CatalogService catalogService) {
        this.catalogService = catalogService;
    }

    @PostMapping
    @Operation(summary = "Create product with initial inventory", description = "Admin endpoint to persist a new SKU and initialize inventory")
    public ResponseEntity<ApiResponse<ProductResponse>> createProduct(@Valid @RequestBody CreateProductRequest request) {
        ProductResponse response = catalogService.createProduct(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(response, "Product and inventory initialized successfully"));
    }

    @GetMapping
    @Operation(summary = "List all active products", description = "Public endpoint for browsing catalog with live available stock")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getAllProducts() {
        List<ProductResponse> products = catalogService.getAllActiveProducts();
        return ResponseEntity.ok(ApiResponse.success(products));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get product details by ID", description = "Public endpoint to inspect product and available stock count")
    public ResponseEntity<ApiResponse<ProductResponse>> getProductById(@PathVariable Long id) {
        ProductResponse product = catalogService.getProductById(id);
        return ResponseEntity.ok(ApiResponse.success(product));
    }

    @GetMapping("/search")
    @Operation(summary = "Search products by keyword", description = "Search titles and descriptions matching query")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> searchProducts(@RequestParam String query) {
        List<ProductResponse> results = catalogService.searchProducts(query);
        return ResponseEntity.ok(ApiResponse.success(results));
    }
}
