package com.draco.seller.dto.payout;

import com.draco.seller.entity.Payout;
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
@Schema(description = "Payout response")
public class PayoutResponse {
    
    private String id;
    private String sellerId;
    private String sellerName;
    private String sellerEmail;
    private Double amount;
    private String currency;
    private Payout.PayoutStatus status;
    private Payout.PaymentMethod paymentMethod;
    private String referenceNumber;
    private String description;
    private String notes;
    private String paymentDetails;
    
    // Admin actions
    private String approvedBy;
    private LocalDateTime approvedAt;
    private String rejectedBy;
    private LocalDateTime rejectedAt;
    private String rejectionReason;
    private String paidBy;
    private LocalDateTime paidAt;
    private String transactionId;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

