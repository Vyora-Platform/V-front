package com.draco.seller.dto.lead;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkLeadAssignRequest {
    
    @NotEmpty(message = "Lead IDs are required")
    private List<String> leadIds;
    
    @NotBlank(message = "Seller ID is required")
    private String newSellerId;
}

