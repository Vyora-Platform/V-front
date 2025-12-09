package com.draco.seller.service;

import com.draco.seller.dto.ReferralInfoResponse;
import com.draco.seller.dto.SellerRegistrationRequest;
import com.draco.seller.dto.SellerResponse;
import com.draco.seller.dto.UpdateSellerRequest;
import com.draco.seller.entity.Seller;
import com.draco.seller.entity.User;
import com.draco.seller.exception.DuplicateResourceException;
import com.draco.seller.exception.ResourceNotFoundException;
import com.draco.seller.repository.SellerRepository;
import com.draco.seller.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.RandomStringUtils;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SellerService {
    
    private final SellerRepository sellerRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    
    @Transactional
    public SellerResponse registerSeller(SellerRegistrationRequest request) {
        log.info("=== Starting seller registration ===");
        log.info("Email: {}", request.getEmail());
        log.info("Name: {}", request.getName());
        log.info("Has Password: {}", request.getPassword() != null);
        
        // Check if seller already exists
        if (sellerRepository.existsByEmail(request.getEmail())) {
            log.error("Duplicate email found: {}", request.getEmail());
            throw new DuplicateResourceException("Seller with email " + request.getEmail() + " already exists");
        }
        
        log.info("Email check passed, creating seller...");
        
        // Generate unique referral code
        String referralCode = generateUniqueReferralCode();
        
        Seller seller = Seller.builder()
                .name(request.getName())
                .email(request.getEmail())
                .phoneNumber(request.getPhoneNumber())
                .businessName(request.getBusinessName())
                .businessType(request.getBusinessType())
                .address(request.getAddress())
                .currentOccupation(request.getCurrentOccupation())
                .numberOfCreators(request.getNumberOfCreators())
                .numberOfFollowers(request.getNumberOfFollowers())
                .referralCode(referralCode)
                .status(Seller.AccountStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .customerIds(new ArrayList<>())
                .referredSellerIds(new ArrayList<>())
                .totalCustomers(0)
                .totalReferrals(0)
                .build();
        
        // Handle referral code if provided
        if (request.getUsedReferralCode() != null && !request.getUsedReferralCode().isEmpty()) {
            Seller referrer = sellerRepository.findByReferralCode(request.getUsedReferralCode())
                    .orElseThrow(() -> new ResourceNotFoundException("Invalid referral code: " + request.getUsedReferralCode()));
            
            seller.setUsedReferralCode(request.getUsedReferralCode());
            seller.setReferredBy(referrer.getId());
            
            // Update referrer's statistics
            referrer.getReferredSellerIds().add(seller.getId());
            referrer.setTotalReferrals(referrer.getTotalReferrals() + 1);
            referrer.setUpdatedAt(LocalDateTime.now());
        }
        
        Seller savedSeller = sellerRepository.save(seller);
        
        // Update referrer after saving the new seller
        if (seller.getReferredBy() != null) {
            Seller referrer = sellerRepository.findById(seller.getReferredBy()).orElseThrow();
            if (!referrer.getReferredSellerIds().contains(savedSeller.getId())) {
                referrer.getReferredSellerIds().add(savedSeller.getId());
                referrer.setTotalReferrals(referrer.getReferredSellerIds().size());
                referrer.setUpdatedAt(LocalDateTime.now());
                sellerRepository.save(referrer);
            }
        }
        
        // If password is provided, create user account automatically
        // This supports both self-registration and admin-created accounts
        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            log.info("Password provided, creating user account...");
            if (!userRepository.existsByEmail(request.getEmail())) {
                try {
                    log.info("Encoding password...");
                    String encodedPassword = passwordEncoder.encode(request.getPassword());
                    log.info("Password encoded successfully");
                    
                    User user = User.builder()
                            .email(request.getEmail())
                            .password(encodedPassword)
                            .name(savedSeller.getName())
                            .role(User.UserRole.SELLER)
                            .sellerId(savedSeller.getId())
                            .enabled(true)
                            .accountNonExpired(true)
                            .accountNonLocked(true)
                            .credentialsNonExpired(true)
                            .createdAt(LocalDateTime.now())
                            .updatedAt(LocalDateTime.now())
                            .build();
                    
                    log.info("Saving user to database...");
                    userRepository.save(user);
                    log.info("User account created successfully for seller: {}", request.getEmail());
                } catch (Exception e) {
                    log.error("Error creating user account: {}", e.getMessage(), e);
                    throw new RuntimeException("Failed to create user account: " + e.getMessage(), e);
                }
            } else {
                log.warn("User account already exists for email: {}", request.getEmail());
            }
        } else {
            log.info("No password provided, skipping user account creation");
        }
        
        log.info("Successfully registered seller with ID: {}", savedSeller.getId());
        SellerResponse response = mapToSellerResponse(savedSeller);
        log.info("Returning response for seller: {}", response.getId());
        return response;
    }
    
    public SellerResponse getSellerById(String sellerId) {
        Seller seller = sellerRepository.findById(sellerId)
                .orElseThrow(() -> new ResourceNotFoundException("Seller not found with ID: " + sellerId));
        return mapToSellerResponse(seller);
    }
    
    public SellerResponse getSellerByEmail(String email) {
        Seller seller = sellerRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Seller not found with email: " + email));
        return mapToSellerResponse(seller);
    }
    
    public List<SellerResponse> getAllSellers() {
        return sellerRepository.findAll().stream()
                .map(this::mapToSellerResponse)
                .collect(Collectors.toList());
    }
    
    public ReferralInfoResponse getReferralInfo(String sellerId) {
        Seller seller = sellerRepository.findById(sellerId)
                .orElseThrow(() -> new ResourceNotFoundException("Seller not found with ID: " + sellerId));
        
        // Get referrer information
        SellerResponse referrerInfo = null;
        if (seller.getReferredBy() != null) {
            Seller referrer = sellerRepository.findById(seller.getReferredBy()).orElse(null);
            if (referrer != null) {
                referrerInfo = mapToSellerResponse(referrer);
            }
        }
        
        // Get referred sellers
        List<SellerResponse> referredSellers = new ArrayList<>();
        if (seller.getReferredSellerIds() != null && !seller.getReferredSellerIds().isEmpty()) {
            referredSellers = sellerRepository.findByIdIn(seller.getReferredSellerIds()).stream()
                    .map(this::mapToSellerResponse)
                    .collect(Collectors.toList());
        }
        
        return ReferralInfoResponse.builder()
                .myReferralCode(seller.getReferralCode())
                .usedReferralCode(seller.getUsedReferralCode())
                .referredBy(referrerInfo)
                .totalReferrals(seller.getTotalReferrals())
                .referredSellers(referredSellers)
                .build();
    }
    
    @Transactional
    public void addCustomerToSeller(String sellerId, String customerId) {
        Seller seller = sellerRepository.findById(sellerId)
                .orElseThrow(() -> new ResourceNotFoundException("Seller not found with ID: " + sellerId));
        
        if (!seller.getCustomerIds().contains(customerId)) {
            seller.getCustomerIds().add(customerId);
            seller.setTotalCustomers(seller.getCustomerIds().size());
            seller.setUpdatedAt(LocalDateTime.now());
            sellerRepository.save(seller);
        }
    }
    
    private String generateUniqueReferralCode() {
        String referralCode;
        do {
            referralCode = "REF" + RandomStringUtils.secure().nextAlphanumeric(8).toUpperCase();
        } while (sellerRepository.existsByReferralCode(referralCode));
        return referralCode;
    }
    
    @Transactional
    public SellerResponse updateSeller(String sellerId, UpdateSellerRequest request) {
        log.info("Updating seller with ID: {}", sellerId);
        
        Seller seller = sellerRepository.findById(sellerId)
                .orElseThrow(() -> new ResourceNotFoundException("Seller not found with ID: " + sellerId));
        
        // Check if email is being changed and if it's already in use
        if (!seller.getEmail().equals(request.getEmail())) {
            if (sellerRepository.existsByEmail(request.getEmail())) {
                throw new DuplicateResourceException("Email " + request.getEmail() + " is already in use");
            }
        }
        
        // Update basic information
        seller.setName(request.getName());
        seller.setEmail(request.getEmail());
        seller.setPhoneNumber(request.getPhoneNumber());
        seller.setBusinessName(request.getBusinessName());
        seller.setBusinessType(request.getBusinessType());
        seller.setAddress(request.getAddress());
        
        // Update type-specific fields
        seller.setCurrentOccupation(request.getCurrentOccupation());
        seller.setNumberOfCreators(request.getNumberOfCreators());
        seller.setNumberOfFollowers(request.getNumberOfFollowers());
        
        if (request.getAccountStatus() != null) {
            seller.setStatus(request.getAccountStatus());
        }
        
        // Update payment information
        seller.setBankName(request.getBankName());
        seller.setAccountNumber(request.getAccountNumber());
        seller.setAccountHolderName(request.getAccountHolderName());
        seller.setIfscCode(request.getIfscCode());
        seller.setPaymentMethod(request.getPaymentMethod());
        seller.setUpiId(request.getUpiId());
        
        seller.setUpdatedAt(LocalDateTime.now());
        
        Seller updatedSeller = sellerRepository.save(seller);
        log.info("Successfully updated seller with ID: {}", sellerId);
        
        return mapToSellerResponse(updatedSeller);
    }
    
    private SellerResponse mapToSellerResponse(Seller seller) {
        return SellerResponse.builder()
                .id(seller.getId())
                .name(seller.getName())
                .email(seller.getEmail())
                .phoneNumber(seller.getPhoneNumber())
                .referralCode(seller.getReferralCode())
                .usedReferralCode(seller.getUsedReferralCode())
                .referredBy(seller.getReferredBy())
                .businessName(seller.getBusinessName())
                .businessType(seller.getBusinessType())
                .address(seller.getAddress())
                .currentOccupation(seller.getCurrentOccupation())
                .numberOfCreators(seller.getNumberOfCreators())
                .numberOfFollowers(seller.getNumberOfFollowers())
                .status(seller.getStatus())
                .totalCustomers(seller.getTotalCustomers())
                .totalReferrals(seller.getTotalReferrals())
                .createdAt(seller.getCreatedAt())
                .updatedAt(seller.getUpdatedAt())
                .bankName(seller.getBankName())
                .accountNumber(seller.getAccountNumber())
                .accountHolderName(seller.getAccountHolderName())
                .ifscCode(seller.getIfscCode())
                .paymentMethod(seller.getPaymentMethod())
                .upiId(seller.getUpiId())
                .build();
    }
}

