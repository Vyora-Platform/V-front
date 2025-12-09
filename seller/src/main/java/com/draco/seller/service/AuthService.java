package com.draco.seller.service;

import com.draco.seller.dto.auth.LoginRequest;
import com.draco.seller.dto.auth.LoginResponse;
import com.draco.seller.dto.auth.RegisterRequest;
import com.draco.seller.entity.Seller;
import com.draco.seller.entity.User;
import com.draco.seller.exception.DuplicateResourceException;
import com.draco.seller.exception.ResourceNotFoundException;
import com.draco.seller.repository.SellerRepository;
import com.draco.seller.repository.UserRepository;
import com.draco.seller.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {
    
    private final UserRepository userRepository;
    private final SellerRepository sellerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    
    @Transactional
    public LoginResponse register(RegisterRequest request) {
        // Check if user already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("User with email " + request.getEmail() + " already exists");
        }
        
        // Find the seller by email
        Seller seller = sellerRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("Seller not found. Please contact admin to create seller account first."));
        
        // Create user
        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .name(seller.getName())
                .role(User.UserRole.SELLER)
                .sellerId(seller.getId())
                .enabled(true)
                .accountNonExpired(true)
                .accountNonLocked(true)
                .credentialsNonExpired(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        
        User savedUser = userRepository.save(user);
        
        // Generate token
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", savedUser.getId());
        claims.put("role", savedUser.getRole().name());
        claims.put("sellerId", savedUser.getSellerId());
        
        String token = jwtUtil.generateToken(savedUser, claims);
        
        return LoginResponse.builder()
                .token(token)
                .email(savedUser.getEmail())
                .name(savedUser.getName())
                .role(savedUser.getRole().name())
                .sellerId(savedUser.getSellerId())
                .build();
    }
    
    public LoginResponse login(LoginRequest request) {
        // Authenticate
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );
        
        // Get user
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        // Update last login
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);
        
        // Generate token
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getId());
        claims.put("role", user.getRole().name());
        claims.put("sellerId", user.getSellerId());
        
        String token = jwtUtil.generateToken(user, claims);
        
        return LoginResponse.builder()
                .token(token)
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole().name())
                .sellerId(user.getSellerId())
                .build();
    }
}

