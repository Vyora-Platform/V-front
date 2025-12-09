package com.draco.seller.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Seller registration request")
public class SellerRegistrationRequest {
    
    @NotBlank(message = "Name is required")
    @Schema(description = "Seller's full name", example = "John Doe")
    private String name;
    
    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    @Schema(description = "Seller's email address", example = "john.doe@example.com")
    private String email;
    
    @Schema(description = "Seller's phone number", example = "+1234567890")
    private String phoneNumber;
    
    @Schema(description = "Password for login (optional for admin creation, required for self-registration)", example = "password123")
    private String password;
    
    @Schema(description = "Referral code used during registration (optional)", example = "REF123456")
    private String usedReferralCode;
    
    @Schema(description = "Business name", example = "John's Electronics")
    private String businessName;
    
    @Schema(description = "Type of business", example = "INDIVIDUAL, AGENCY, CREATOR")
    private String businessType;
    
    @Schema(description = "Business address")
    private String address;
    
    // Type-specific fields
    @Schema(description = "Current occupation (for INDIVIDUAL type)", example = "Software Developer")
    private String currentOccupation;
    
    @Schema(description = "Number of creators range (for AGENCY type)", example = "11-25")
    private String numberOfCreators;
    
    @Schema(description = "Number of followers range (for CREATOR type)", example = "10K-50K")
    private String numberOfFollowers;
}

