package com.draco.seller.service;

import com.draco.seller.dto.ApiResponse;
import com.draco.seller.dto.auth.ForgotPasswordRequest;
import com.draco.seller.dto.auth.LoginRequest;
import com.draco.seller.dto.auth.LoginResponse;
import com.draco.seller.dto.auth.RegisterRequest;
import com.draco.seller.dto.auth.ResetPasswordRequest;
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
import java.util.Random;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {
    
    private final UserRepository userRepository;
    private final SellerRepository sellerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;
    
    private static final int OTP_EXPIRATION_MINUTES = 10;
    
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
    
    @Transactional
    public ApiResponse forgotPassword(ForgotPasswordRequest request) {
        log.info("Forgot password request for email: {}", request.getEmail());
        
        try {
            // Find user by email
            User user = userRepository.findByEmail(request.getEmail())
                    .orElseThrow(() -> {
                        log.warn("User not found with email: {}", request.getEmail());
                        return new ResourceNotFoundException("User not found with email: " + request.getEmail());
                    });
            
            // Generate 6-digit OTP
            String otp = String.format("%06d", new Random().nextInt(999999));
            
            // Set OTP expiry time
            LocalDateTime otpExpiry = LocalDateTime.now().plusMinutes(OTP_EXPIRATION_MINUTES);
            
            // Save OTP and expiry to user
            user.setOtp(otp);
            user.setOtpExpiry(otpExpiry);
            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);
            
            log.info("OTP generated for user: {}", request.getEmail());
            
            // Send OTP via email
            emailService.sendOtpEmail(request.getEmail(), otp);
            
            log.info("OTP sent successfully to: {}", request.getEmail());
            
            return ApiResponse.builder()
                    .success(true)
                    .message("OTP sent successfully to your email. Please check your inbox.")
                    .build();
                    
        } catch (ResourceNotFoundException e) {
            log.error("User not found: {}", request.getEmail());
            return ApiResponse.builder()
                    .success(false)
                    .message("User not found with email: " + request.getEmail())
                    .build();
        } catch (Exception e) {
            log.error("Failed to send OTP email to: {}", request.getEmail(), e);
            return ApiResponse.builder()
                    .success(false)
                    .message("Failed to send OTP email. Please try again later.")
                    .build();
        }
    }
    
    @Transactional
    public ApiResponse resetPassword(ResetPasswordRequest request) {
        log.info("Reset password request for email: {}", request.getEmail());
        
        try {
            // Find user by email
            User user = userRepository.findByEmail(request.getEmail())
                    .orElseThrow(() -> {
                        log.warn("User not found with email: {}", request.getEmail());
                        return new ResourceNotFoundException("User not found with email: " + request.getEmail());
                    });
            
            // Validate OTP
            if (user.getOtp() == null || user.getOtp().isEmpty()) {
                log.warn("No OTP found for user: {}", request.getEmail());
                return ApiResponse.builder()
                        .success(false)
                        .message("No OTP found. Please request a new OTP.")
                        .build();
            }
            
            if (!user.getOtp().equals(request.getOtp())) {
                log.warn("Invalid OTP provided for user: {}", request.getEmail());
                return ApiResponse.builder()
                        .success(false)
                        .message("Invalid OTP. Please check and try again.")
                        .build();
            }
            
            // Check if OTP is expired
            if (user.getOtpExpiry() == null || LocalDateTime.now().isAfter(user.getOtpExpiry())) {
                log.warn("OTP expired for user: {}", request.getEmail());
                // Clear expired OTP
                user.setOtp(null);
                user.setOtpExpiry(null);
                userRepository.save(user);
                
                return ApiResponse.builder()
                        .success(false)
                        .message("OTP has expired. Please request a new OTP.")
                        .build();
            }
            
            // Reset password
            user.setPassword(passwordEncoder.encode(request.getNewPassword()));
            user.setOtp(null);
            user.setOtpExpiry(null);
            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);
            
            log.info("Password reset successfully for user: {}", request.getEmail());
            
            return ApiResponse.builder()
                    .success(true)
                    .message("Password reset successfully. You can now login with your new password.")
                    .build();
                    
        } catch (ResourceNotFoundException e) {
            log.error("User not found: {}", request.getEmail());
            return ApiResponse.builder()
                    .success(false)
                    .message("User not found with email: " + request.getEmail())
                    .build();
        } catch (Exception e) {
            log.error("Failed to reset password for user: {}", request.getEmail(), e);
            return ApiResponse.builder()
                    .success(false)
                    .message("Failed to reset password. Please try again later.")
                    .build();
        }
    }
}

