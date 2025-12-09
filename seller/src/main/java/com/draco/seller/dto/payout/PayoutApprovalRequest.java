package com.draco.seller.dto.payout;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Payout approval/rejection request")
public class PayoutApprovalRequest {
    
    @Schema(description = "Transaction ID for payment proof")
    private String transactionId;
    
    @Schema(description = "Rejection reason (if rejecting)")
    private String rejectionReason;
    
    @Schema(description = "Additional notes")
    private String notes;
}

