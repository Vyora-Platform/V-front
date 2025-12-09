package com.draco.seller.dto.auth;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Login/Register response")
public class LoginResponse {
    
    @Schema(description = "JWT token")
    private String token;
    
    @Schema(description = "User email")
    private String email;
    
    @Schema(description = "User name")
    private String name;
    
    @Schema(description = "User role")
    private String role;
    
    @Schema(description = "Seller ID")
    private String sellerId;
}

