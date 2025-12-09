package com.draco.seller.dto.payout;

import com.draco.seller.entity.Payout;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Payout creation/update request")
public class PayoutRequest {
    
    @NotBlank(message = "Seller ID is required")
    @Schema(description = "Seller ID", example = "seller123")
    private String sellerId;
    
    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be positive")
    @Schema(description = "Payout amount", example = "5000.00")
    private Double amount;
    
    @Schema(description = "Currency code", example = "INR")
    private String currency;
    
    @Schema(description = "Payment method")
    private Payout.PaymentMethod paymentMethod;
    
    @Schema(description = "Description", example = "Commission for January 2025")
    private String description;
    
    @NotBlank(message = "Payment details are required")
    @Schema(description = "Payment details (account info, UPI ID, etc.)", example = "Account: 1234567890, IFSC: ABCD0001234")
    private String paymentDetails;
    
    @Schema(description = "Seller notes/remarks")
    private String sellerNotes;
    
    @Schema(description = "Additional notes")
    private String notes;
}

