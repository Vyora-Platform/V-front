package com.draco.seller.dto;

import com.draco.seller.entity.SellerReward;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SellerRewardRequest {
    
    @NotBlank(message = "Seller unique code is required")
    private String sellerUniqueCode;
    
    @NotNull(message = "Referral points is required")
    @Positive(message = "Referral points must be positive")
    private Integer referralPoint;
    
    private String referrerId;  // Optional - ID of the referrer
    
    @NotNull(message = "Referrer type is required")
    private SellerReward.ReferrerType referrerType;
}

