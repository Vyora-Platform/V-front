package com.draco.seller.dto.lead;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkLeadUploadResult {
    
    private int totalProcessed;
    
    private int successfullyCreated;
    
    private int failed;
    
    @Builder.Default
    private List<String> errors = new ArrayList<>();
    
    @Builder.Default
    private List<String> createdLeadIds = new ArrayList<>();
}

