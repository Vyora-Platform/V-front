package com.draco.seller.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "seller_rewards")
public class SellerReward {
    
    @Id
    private String id;
    
    @Indexed
    private String sellerId;  // ID of the seller who earned the reward
    
    private String referrerId;  // ID of the seller who referred (can be null for direct rewards)
    
    private ReferrerType referrerType;  // Type of referral
    
    private Integer referralPoint;  // Points earned
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    public enum ReferrerType {
        SELLER_REFERRAL,  // Referred by another seller
        CUSTOMER_REFERRAL,  // Referred by a customer
        DIRECT_SIGNUP,  // Direct signup without referral
        BONUS,  // Bonus points
        OTHER  // Other types
    }
}

