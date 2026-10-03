package com.platform.orderfleet.catalog.service;

import com.platform.orderfleet.catalog.dto.CategoryResponse;
import com.platform.orderfleet.catalog.dto.CreateCategoryRequest;
import com.platform.orderfleet.catalog.dto.CreateProductRequest;
import com.platform.orderfleet.catalog.dto.ProductResponse;
import com.platform.orderfleet.catalog.entity.Category;
import com.platform.orderfleet.catalog.entity.InventoryItem;
import com.platform.orderfleet.catalog.entity.Product;
import com.platform.orderfleet.catalog.exception.ResourceNotFoundException;
import com.platform.orderfleet.catalog.repository.CategoryRepository;
import com.platform.orderfleet.catalog.repository.InventoryItemRepository;
import com.platform.orderfleet.catalog.repository.ProductRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CatalogService {

    private static final Logger log = LoggerFactory.getLogger(CatalogService.class);

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final InventoryItemRepository inventoryItemRepository;

    public CatalogService(ProductRepository productRepository,
                          CategoryRepository categoryRepository,
                          InventoryItemRepository inventoryItemRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.inventoryItemRepository = inventoryItemRepository;
    }

    @Transactional
    public CategoryResponse createCategory(CreateCategoryRequest request) {
        log.info("Creating dynamic category with name: {}", request.name());

        if (categoryRepository.existsBySlug(request.slug())) {
            throw new IllegalArgumentException("Category slug already exists: " + request.slug());
        }

        Category category = new Category(
                request.name().trim(),
                request.slug().trim().toLowerCase(),
                request.description() != null ? request.description().trim() : null
        );

        Category saved = categoryRepository.save(category);
        return new CategoryResponse(saved.getId(), saved.getName(), saved.getSlug(), saved.getDescription(), saved.getCreatedAt());
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> getAllCategories() {
        return categoryRepository.findAll().stream()
                .map(c -> new CategoryResponse(c.getId(), c.getName(), c.getSlug(), c.getDescription(), c.getCreatedAt()))
                .toList();
    }

    @Transactional
    public ProductResponse createProduct(CreateProductRequest request) {
        log.info("Creating dynamic product with SKU: {}", request.sku());

        if (productRepository.existsBySku(request.sku())) {
            throw new IllegalArgumentException("Product SKU already exists: " + request.sku());
        }

        Category category = null;
        if (request.categoryId() != null) {
            category = categoryRepository.findById(request.categoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found with ID: " + request.categoryId()));
        }

        Product product = new Product(
                request.sku().trim().toUpperCase(),
                request.title().trim(),
                request.description() != null ? request.description().trim() : null,
                request.price(),
                category,
                true
        );

        Product savedProduct = productRepository.save(product);

        // Dynamically initialize inventory tracking record
        InventoryItem inventory = new InventoryItem(
                savedProduct.getId(),
                request.initialStock(),
                0
        );
        inventoryItemRepository.save(inventory);

        return mapToProductResponse(savedProduct, request.initialStock());
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> getAllActiveProducts() {
        return productRepository.findByActiveTrue().stream()
                .map(p -> {
                    int availableStock = inventoryItemRepository.findByProductId(p.getId())
                            .map(InventoryItem::getAvailableQuantity)
                            .orElse(0);
                    return mapToProductResponse(p, availableStock);
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public ProductResponse getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + id));

        int availableStock = inventoryItemRepository.findByProductId(product.getId())
                .map(InventoryItem::getAvailableQuantity)
                .orElse(0);

        return mapToProductResponse(product, availableStock);
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> searchProducts(String query) {
        return productRepository.searchProducts(query).stream()
                .map(p -> {
                    int availableStock = inventoryItemRepository.findByProductId(p.getId())
                            .map(InventoryItem::getAvailableQuantity)
                            .orElse(0);
                    return mapToProductResponse(p, availableStock);
                })
                .toList();
    }

    private ProductResponse mapToProductResponse(Product product, int availableStock) {
        Long categoryId = product.getCategory() != null ? product.getCategory().getId() : null;
        String categoryName = product.getCategory() != null ? product.getCategory().getName() : null;

        return new ProductResponse(
                product.getId(),
                product.getSku(),
                product.getTitle(),
                product.getDescription(),
                product.getPrice(),
                categoryId,
                categoryName,
                availableStock,
                product.isActive(),
                product.getCreatedAt()
        );
    }
}
