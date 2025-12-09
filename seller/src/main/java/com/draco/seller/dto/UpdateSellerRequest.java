package com.draco.seller.dto;

import com.draco.seller.entity.Seller;
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
@Schema(description = "Seller update request")
public class UpdateSellerRequest {
    
    @NotBlank(message = "Name is required")
    @Schema(description = "Seller's name")
    private String name;
    
    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    @Schema(description = "Seller's email")
    private String email;
    
    @Schema(description = "Phone number")
    private String phoneNumber;
    
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
    private Seller.AccountStatus accountStatus;
    
    // Payment Information
    @Schema(description = "Bank name")
    private String bankName;
    
    @Schema(description = "Bank account number")
    private String accountNumber;
    
    @Schema(description = "Account holder name")
    private String accountHolderName;
    
    @Schema(description = "IFSC code or routing number")
    private String ifscCode;
    
    @Schema(description = "Preferred payment method (BANK_TRANSFER, PAYPAL, UPI, CHEQUE, OTHER)")
    private String paymentMethod;
    
    @Schema(description = "UPI ID or PayPal email")
    private String upiId;
}

