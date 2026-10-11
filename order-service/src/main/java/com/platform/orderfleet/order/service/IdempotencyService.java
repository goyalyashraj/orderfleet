package com.platform.orderfleet.order.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.platform.orderfleet.order.dto.OrderResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Optional;

@Service
public class IdempotencyService {

    private static final Logger log = LoggerFactory.getLogger(IdempotencyService.class);
    private static final String IDEMPOTENCY_PREFIX = "order:idempotency:";
    private static final String LOCK_PREFIX = "order:lock:idempotency:";

    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;

    public IdempotencyService(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = new ObjectMapper().findAndRegisterModules();
    }

    public Optional<OrderResponse> getCachedResponse(String idempotencyKey) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            return Optional.empty();
        }

        String redisKey = IDEMPOTENCY_PREFIX + idempotencyKey.trim();
        try {
            Object cached = redisTemplate.opsForValue().get(redisKey);
            if (cached != null) {
                log.info("Idempotent hit for key: {}. Returning cached order response.", idempotencyKey);
                if (cached instanceof OrderResponse orderResponse) {
                    return Optional.of(orderResponse);
                }
                OrderResponse response = objectMapper.convertValue(cached, OrderResponse.class);
                return Optional.of(response);
            }
        } catch (Exception ex) {
            log.warn("Redis error reading idempotency key '{}': {}", idempotencyKey, ex.getMessage());
        }
        return Optional.empty();
    }

    public boolean acquireProcessingLock(String idempotencyKey, Duration lockTtl) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            return true;
        }

        String lockKey = LOCK_PREFIX + idempotencyKey.trim();
        try {
            Boolean acquired = redisTemplate.opsForValue().setIfAbsent(lockKey, "IN_PROGRESS", lockTtl);
            return Boolean.TRUE.equals(acquired);
        } catch (Exception ex) {
            log.warn("Redis error acquiring idempotency lock for '{}': {}", idempotencyKey, ex.getMessage());
            return true; // Fail-open gracefully if Redis has temporary issue
        }
    }

    public void saveResponse(String idempotencyKey, OrderResponse response, Duration responseTtl) {
        if (idempotencyKey == null || idempotencyKey.isBlank() || response == null) {
            return;
        }

        String redisKey = IDEMPOTENCY_PREFIX + idempotencyKey.trim();
        String lockKey = LOCK_PREFIX + idempotencyKey.trim();
        try {
            redisTemplate.opsForValue().set(redisKey, response, responseTtl);
            redisTemplate.delete(lockKey);
            log.info("Cached order response under idempotency key '{}' with TTL {}", idempotencyKey, responseTtl);
        } catch (Exception ex) {
            log.warn("Redis error saving idempotency response for '{}': {}", idempotencyKey, ex.getMessage());
        }
    }

    public void releaseProcessingLock(String idempotencyKey) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            return;
        }

        String lockKey = LOCK_PREFIX + idempotencyKey.trim();
        try {
            redisTemplate.delete(lockKey);
        } catch (Exception ex) {
            log.warn("Redis error releasing lock for '{}': {}", idempotencyKey, ex.getMessage());
        }
    }
}
