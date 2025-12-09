package com.draco.seller.dto;

import com.draco.seller.entity.Seller;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Seller information response")
public class SellerResponse {
    
    @Schema(description = "Seller ID")
    private String id;
    
    @Schema(description = "Seller's name")
    private String name;
    
    @Schema(description = "Seller's email")
    private String email;
    
    @Schema(description = "Seller's phone number")
    private String phoneNumber;
    
    @Schema(description = "Unique referral code for this seller")
    private String referralCode;
    
    @Schema(description = "Referral code used during registration")
    private String usedReferralCode;
    
    @Schema(description = "ID of the seller who referred this seller")
    private String referredBy;
    
    @Schema(description = "Business name")
    private String businessName;
    
    @Schema(description = "Business type (INDIVIDUAL, AGENCY, CREATOR)")
    private String businessType;
    
    @Schema(description = "Business address")
    private String address;
    
    // Type-specific fields
    @Schema(description = "Current occupation (for INDIVIDUAL type)")
    private String currentOccupation;
    
    @Schema(description = "Number of creators range (for AGENCY type)")
    private String numberOfCreators;
    
    @Schema(description = "Number of followers range (for CREATOR type)")
    private String numberOfFollowers;
    
    @Schema(description = "Account status")
    private Seller.AccountStatus status;
    
    @Schema(description = "Total number of customers")
    private Integer totalCustomers;
    
    @Schema(description = "Total number of referrals")
    private Integer totalReferrals;
    
    @Schema(description = "Account creation timestamp")
    private LocalDateTime createdAt;
    
    @Schema(description = "Last update timestamp")
    private LocalDateTime updatedAt;
    
    // Payment Information
    @Schema(description = "Bank name")
    private String bankName;
    
    @Schema(description = "Bank account number")
    private String accountNumber;
    
    @Schema(description = "Account holder name")
    private String accountHolderName;
    
    @Schema(description = "IFSC code or routing number")
    private String ifscCode;
    
    @Schema(description = "Preferred payment method")
    private String paymentMethod;
    
    @Schema(description = "UPI ID or PayPal email")
    private String upiId;
}

