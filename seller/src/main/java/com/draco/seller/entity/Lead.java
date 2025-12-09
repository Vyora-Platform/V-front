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
@Document(collection = "leads")
public class Lead {
    
    @Id
    private String id;
    
    private String name;
    
    @Indexed
    private String email;
    
    private String phoneNumber;
    
    @Indexed
    private String sellerId; // Owner of this lead
    
    private LeadStatus status;
    
    private LeadSource source;
    
    private String notes;
    
    private String company;
    
    private String location;
    
    private Double estimatedValue;
    
    private LocalDateTime lastContactedAt;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    public enum LeadStatus {
        NEW,
        CONTACTED,
        QUALIFIED,
        NEGOTIATION,
        WON,
        LOST,
        FOLLOW_UP
    }
    
    public enum LeadSource {
        WEBSITE,
        REFERRAL,
        SOCIAL_MEDIA,
        EMAIL_CAMPAIGN,
        PHONE_CALL,
        DIRECT,
        OTHER
    }
}

