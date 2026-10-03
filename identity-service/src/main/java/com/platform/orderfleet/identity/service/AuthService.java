package com.platform.orderfleet.identity.service;

import com.platform.orderfleet.common.enums.RoleType;
import com.platform.orderfleet.identity.config.JwtProperties;
import com.platform.orderfleet.identity.dto.AuthResponse;
import com.platform.orderfleet.identity.dto.LoginRequest;
import com.platform.orderfleet.identity.dto.RegisterRequest;
import com.platform.orderfleet.identity.dto.UserProfileResponse;
import com.platform.orderfleet.identity.entity.Role;
import com.platform.orderfleet.identity.entity.User;
import com.platform.orderfleet.identity.exception.EmailAlreadyExistsException;
import com.platform.orderfleet.identity.exception.ResourceNotFoundException;
import com.platform.orderfleet.identity.repository.RoleRepository;
import com.platform.orderfleet.identity.repository.UserRepository;
import com.platform.orderfleet.identity.security.JwtTokenProvider;
import com.platform.orderfleet.identity.security.UserPrincipal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final JwtProperties jwtProperties;

    public AuthService(UserRepository userRepository,
                       RoleRepository roleRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtTokenProvider tokenProvider,
                       JwtProperties jwtProperties) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
        this.jwtProperties = jwtProperties;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        log.info("Processing dynamic registration request for email: {}", request.email());

        if (userRepository.existsByEmail(request.email())) {
            throw new EmailAlreadyExistsException("Email is already registered: " + request.email());
        }

        Set<Role> roles = new HashSet<>();
        if (request.roles() == null || request.roles().isEmpty()) {
            Role customerRole = roleRepository.findByName(RoleType.ROLE_CUSTOMER)
                    .orElseGet(() -> roleRepository.save(new Role(RoleType.ROLE_CUSTOMER)));
            roles.add(customerRole);
        } else {
            for (RoleType roleType : request.roles()) {
                Role role = roleRepository.findByName(roleType)
                        .orElseGet(() -> roleRepository.save(new Role(roleType)));
                roles.add(role);
            }
        }

        User user = new User(
                request.email().toLowerCase().trim(),
                passwordEncoder.encode(request.password()),
                request.firstName().trim(),
                request.lastName().trim(),
                request.phone() != null ? request.phone().trim() : null,
                "ACTIVE",
                roles
        );

        User savedUser = userRepository.save(user);
        log.info("User registered successfully with ID: {}", savedUser.getId());

        UserPrincipal principal = UserPrincipal.create(savedUser);
        String token = tokenProvider.generateToken(principal);

        List<String> roleNames = principal.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .toList();

        return AuthResponse.of(
                token,
                jwtProperties.getExpirationMs(),
                savedUser.getId(),
                savedUser.getEmail(),
                roleNames
        );
    }

    public AuthResponse login(LoginRequest request) {
        log.info("Processing dynamic login authentication for email: {}", request.email());

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.email().toLowerCase().trim(),
                        request.password()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();

        String token = tokenProvider.generateToken(principal);
        List<String> roleNames = principal.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .toList();

        return AuthResponse.of(
                token,
                jwtProperties.getExpirationMs(),
                principal.getId(),
                principal.getEmail(),
                roleNames
        );
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getCurrentUserProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        List<String> roleNames = user.getRoles().stream()
                .map(role -> role.getName().name())
                .toList();

        return new UserProfileResponse(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getPhone(),
                user.getStatus(),
                roleNames,
                user.getCreatedAt()
        );
    }

    @Transactional(readOnly = true)
    public List<UserProfileResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(user -> new UserProfileResponse(
                        user.getId(),
                        user.getEmail(),
                        user.getFirstName(),
                        user.getLastName(),
                        user.getPhone(),
                        user.getStatus(),
                        user.getRoles().stream().map(r -> r.getName().name()).toList(),
                        user.getCreatedAt()
                ))
                .toList();
    }
}
