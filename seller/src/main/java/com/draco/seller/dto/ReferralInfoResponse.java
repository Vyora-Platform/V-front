package com.draco.seller.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Referral information for a seller")
public class ReferralInfoResponse {
    
    @Schema(description = "Seller's referral code")
    private String myReferralCode;
    
    @Schema(description = "Referral code used during registration")
    private String usedReferralCode;
    
    @Schema(description = "Information about the seller who referred this seller")
    private SellerResponse referredBy;
    
    @Schema(description = "Total number of referrals")
    private Integer totalReferrals;
    
    @Schema(description = "List of sellers referred by this seller")
    private List<SellerResponse> referredSellers;
}

