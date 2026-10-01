package com.platform.orderfleet.identity.security;

import com.platform.orderfleet.identity.config.JwtProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class JwtTokenProviderTest {

    private JwtTokenProvider jwtTokenProvider;

    @BeforeEach
    void setUp() {
        JwtProperties properties = new JwtProperties();
        // 256-bit test secret
        properties.setSecret("d41d8cd98f00b204e9800998ecf8427e4b5a6c7d8e9f0a1b2c3d4e5f6a7b8c9d");
        properties.setExpirationMs(3600000); // 1 hour

        jwtTokenProvider = new JwtTokenProvider(properties);
        jwtTokenProvider.init();
    }

    @Test
    @DisplayName("Should generate valid JWT token and parse claims correctly")
    void testGenerateAndValidateToken() {
        UserPrincipal principal = new UserPrincipal(
                101L,
                "testuser@orderfleet.com",
                "encoded_password",
                "Test",
                "User",
                List.of(new SimpleGrantedAuthority("ROLE_CUSTOMER"))
        );

        String token = jwtTokenProvider.generateToken(principal);

        assertNotNull(token);
        assertTrue(jwtTokenProvider.validateToken(token));
        assertEquals("testuser@orderfleet.com", jwtTokenProvider.getEmailFromToken(token));
        assertEquals(101L, jwtTokenProvider.getUserIdFromToken(token));
    }

    @Test
    @DisplayName("Should reject invalid or tampered JWT token")
    void testInvalidToken() {
        String invalidToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.tampered.payload";
        assertFalse(jwtTokenProvider.validateToken(invalidToken));
    }
}
