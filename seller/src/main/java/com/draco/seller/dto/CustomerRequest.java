package com.draco.seller.dto;

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
@Schema(description = "Customer creation/update request")
public class CustomerRequest {
    
    @NotBlank(message = "Name is required")
    @Schema(description = "Customer's full name", example = "Jane Smith")
    private String name;
    
    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    @Schema(description = "Customer's email address", example = "jane.smith@example.com")
    private String email;
    
    @NotBlank(message = "Phone number is required")
    @Schema(description = "Customer's phone number", example = "+1234567890")
    private String phoneNumber;
    
    @Schema(description = "Customer's address")
    private String address;
    
    @Schema(description = "Customer status", example = "ACTIVE", allowableValues = {"ACTIVE", "INACTIVE", "BLOCKED"})
    private String status;
}

