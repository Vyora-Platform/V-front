package com.draco.seller.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "sellers")
public class Seller {
    
    @Id
    private String id;
    
    @Indexed(unique = true)
    private String email;
    
    private String name;
    
    private String phoneNumber;
    
    @Indexed(unique = true)
    private String referralCode;
    
    private String usedReferralCode; // Referral code used during registration
    
    private String referredBy; // ID of the seller who referred this seller
    
    @Builder.Default
    private List<String> customerIds = new ArrayList<>();
    
    @Builder.Default
    private List<String> referredSellerIds = new ArrayList<>();
    
    private String businessName;
    
    private String businessType; // INDIVIDUAL, AGENCY, CREATOR
    
    private String address;
    
    // Type-specific fields
    private String currentOccupation; // For INDIVIDUAL type
    private String numberOfCreators; // For AGENCY type (range: "1-5", "6-10", etc.)
    private String numberOfFollowers; // For CREATOR type (range: "0-1K", "10K-50K", etc.)
    
    private AccountStatus status;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    @Builder.Default
    private Integer totalCustomers = 0;
    
    @Builder.Default
    private Integer totalReferrals = 0;
    
    // Payment Information
    private String bankName;
    private String accountNumber;
    private String accountHolderName;
    private String ifscCode; // IFSC for India, Routing number for US
    private String paymentMethod; // BANK_TRANSFER, PAYPAL, UPI, CHEQUE, etc.
    private String upiId; // For UPI or PayPal email
    
    public enum AccountStatus {
        PENDING,
        ACTIVE,
        SUSPENDED,
        INACTIVE
    }
}

