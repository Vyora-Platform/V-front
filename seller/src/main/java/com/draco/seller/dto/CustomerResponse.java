package com.draco.seller.dto;

import com.draco.seller.entity.Customer;
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
@Schema(description = "Customer information response")
public class CustomerResponse {
    
    @Schema(description = "Customer ID")
    private String id;
    
    @Schema(description = "Customer's name")
    private String name;
    
    @Schema(description = "Customer's email")
    private String email;
    
    @Schema(description = "Customer's phone number")
    private String phoneNumber;
    
    @Schema(description = "ID of the seller who owns this customer")
    private String sellerId;
    
    @Schema(description = "Customer's address")
    private String address;
    
    @Schema(description = "Customer status")
    private Customer.CustomerStatus status;
    
    @Schema(description = "Customer creation timestamp")
    private LocalDateTime createdAt;
    
    @Schema(description = "Last update timestamp")
    private LocalDateTime updatedAt;
}

