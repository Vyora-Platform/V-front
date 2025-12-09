package com.draco.seller.dto;

import com.draco.seller.entity.SellerReward;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SellerRewardResponse {
    
    private String id;
    private String sellerId;
    private String sellerName;
    private String sellerEmail;
    private String sellerUniqueCode;
    private String referrerId;
    private SellerReward.ReferrerType referrerType;
    private Integer referralPoint;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

