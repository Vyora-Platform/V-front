package com.draco.seller.dto.lead;

import com.draco.seller.entity.Lead;
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
@Schema(description = "Lead response")
public class LeadResponse {
    
    @Schema(description = "Lead ID")
    private String id;
    
    private String name;
    private String email;
    private String phoneNumber;
    private String sellerId;
    private Lead.LeadStatus status;
    private Lead.LeadSource source;
    private String notes;
    private String company;
    private String location;
    private Double estimatedValue;
    private LocalDateTime lastContactedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

