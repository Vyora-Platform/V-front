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
@Document(collection = "payouts")
public class Payout {
    
    @Id
    private String id;
    
    @Indexed
    private String sellerId;
    
    private String sellerName;
    
    private String sellerEmail;
    
    private Double amount;
    
    private String currency;
    
    @Indexed
    private PayoutStatus status;
    
    private PaymentMethod paymentMethod;
    
    private String referenceNumber;
    
    private String description;
    
    private String notes;
    
    // Payment details (all payment information in one field)
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
    
    public enum PayoutStatus {
        PENDING,
        APPROVED,
        PROCESSING,
        PAID,
        REJECTED,
        CANCELLED
    }
    
    public enum PaymentMethod {
        BANK_TRANSFER,
        UPI,
        CHEQUE,
        CASH,
        PAYPAL,
        OTHER
    }
}

