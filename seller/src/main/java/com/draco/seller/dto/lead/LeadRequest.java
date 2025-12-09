package com.draco.seller.dto.lead;

import com.draco.seller.entity.Lead;
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
@Schema(description = "Lead creation/update request")
public class LeadRequest {
    
    @NotBlank(message = "Name is required")
    @Schema(description = "Lead's name")
    private String name;
    
    @Email(message = "Email should be valid")
    @Schema(description = "Lead's email")
    private String email;
    
    @Schema(description = "Lead's phone number")
    private String phoneNumber;
    
    @Schema(description = "Seller ID (for admin updates)")
    private String sellerId;
    
    @Schema(description = "Lead status")
    private Lead.LeadStatus status;
    
    @Schema(description = "Lead source")
    private Lead.LeadSource source;
    
    @Schema(description = "Notes about the lead")
    private String notes;
    
    @Schema(description = "Company name")
    private String company;
    
    @Schema(description = "Location")
    private String location;
    
    @Schema(description = "Estimated value")
    private Double estimatedValue;
}

