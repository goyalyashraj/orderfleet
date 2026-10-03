package com.platform.orderfleet.order.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.platform.orderfleet.order.exception.InventoryReservationFailedException;
import com.platform.orderfleet.order.exception.ResourceNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.util.Map;

@Component
public class CatalogClient {

    private static final Logger log = LoggerFactory.getLogger(CatalogClient.class);

    private final RestClient catalogRestClient;
    private final ObjectMapper objectMapper;

    public CatalogClient(RestClient catalogRestClient, ObjectMapper objectMapper) {
        this.catalogRestClient = catalogRestClient;
        this.objectMapper = objectMapper;
    }

    public CatalogProductDto getProductById(Long productId) {
        log.info("Executing inter-service REST call: GET /api/v1/products/{}", productId);
        try {
            String responseBody = catalogRestClient.get()
                    .uri("/api/v1/products/{id}", productId)
                    .accept(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .onStatus(HttpStatusCode::is4xxClientError, (req, resp) -> {
                        throw new ResourceNotFoundException("Product not found in catalog with ID: " + productId);
                    })
                    .body(String.class);

            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode data = root.path("data");

            return new CatalogProductDto(
                    data.path("id").asLong(),
                    data.path("sku").asText(),
                    data.path("title").asText(),
                    new BigDecimal(data.path("price").asText()),
                    data.path("availableStock").asInt(),
                    data.path("active").asBoolean()
            );
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to fetch product from catalog service: {}", e.getMessage());
            throw new RuntimeException("Catalog service unavailable or returned an error: " + e.getMessage(), e);
        }
    }

    public StockReservationResultDto reserveStock(Long orderId, Long productId, int quantity) {
        log.info("Executing inter-service REST call: POST /api/v1/inventory/reserve for Order {}, Product {}, Qty {}",
                orderId, productId, quantity);

        Map<String, Object> body = Map.of(
                "orderId", orderId,
                "productId", productId,
                "quantity", quantity
        );

        try {
            String responseBody = catalogRestClient.post()
                    .uri("/api/v1/inventory/reserve")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .onStatus(status -> status.value() == 409, (req, resp) -> {
                        String errJson = new String(resp.getBody().readAllBytes());
                        JsonNode errRoot = objectMapper.readTree(errJson);
                        String errMsg = errRoot.path("message").asText("Stock unavailable");
                        throw new InventoryReservationFailedException(errMsg);
                    })
                    .body(String.class);

            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode data = root.path("data");

            return new StockReservationResultDto(
                    data.path("reservationCode").asText(),
                    data.path("orderId").asLong(),
                    data.path("productId").asLong(),
                    data.path("quantity").asInt(),
                    data.path("status").asText()
            );
        } catch (InventoryReservationFailedException e) {
            throw e;
        } catch (Exception e) {
            log.error("Stock reservation failed unexpectedly: {}", e.getMessage());
            throw new InventoryReservationFailedException("Inventory reservation failed: " + e.getMessage());
        }
    }

    public void releaseStock(String reservationCode) {
        log.info("Executing inter-service REST call: POST /api/v1/inventory/release for Code {}", reservationCode);
        try {
            catalogRestClient.post()
                    .uri("/api/v1/inventory/release")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("reservationCode", reservationCode))
                    .retrieve()
                    .toBodilessEntity();
            log.info("Stock reservation successfully released via REST for Code: {}", reservationCode);
        } catch (Exception e) {
            log.error("Failed to release stock reservation {}: {}", reservationCode, e.getMessage());
        }
    }

    public void confirmReservation(String reservationCode) {
        log.info("Executing inter-service REST call: POST /api/v1/inventory/confirm/{}", reservationCode);
        try {
            catalogRestClient.post()
                    .uri("/api/v1/inventory/confirm/{reservationCode}", reservationCode)
                    .retrieve()
                    .toBodilessEntity();
            log.info("Stock reservation successfully confirmed via REST for Code: {}", reservationCode);
        } catch (Exception e) {
            log.error("Failed to confirm stock reservation {}: {}", reservationCode, e.getMessage());
            throw new RuntimeException("Failed to confirm stock reservation: " + e.getMessage(), e);
        }
    }
}
