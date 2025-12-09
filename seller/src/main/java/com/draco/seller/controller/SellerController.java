package com.draco.seller.controller;

import com.draco.seller.dto.ReferralInfoResponse;
import com.draco.seller.dto.SellerRegistrationRequest;
import com.draco.seller.dto.SellerResponse;
import com.draco.seller.dto.UpdateSellerRequest;
import com.draco.seller.service.SellerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/sellers")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Seller Management", description = "APIs for seller onboarding, management, and referral tracking")
public class SellerController {
    
    private final SellerService sellerService;
    
    @PostMapping("/register")
    @Operation(
        summary = "Register a new seller",
        description = "Create a new seller account. Optionally provide a referral code from another seller."
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "201",
            description = "Seller registered successfully",
            content = @Content(schema = @Schema(implementation = SellerResponse.class))
        ),
        @ApiResponse(
            responseCode = "400",
            description = "Invalid input data"
        ),
        @ApiResponse(
            responseCode = "409",
            description = "Seller with this email already exists"
        )
    })
    public ResponseEntity<SellerResponse> registerSeller(
            @Valid @RequestBody SellerRegistrationRequest request) {
        log.info("Received registration request for: {}", request.getEmail());
        try {
            SellerResponse response = sellerService.registerSeller(request);
            log.info("Registration successful, returning response");
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (Exception e) {
            log.error("Registration failed: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    @GetMapping("/{sellerId}")
    @Operation(
        summary = "Get seller by ID",
        description = "Retrieve detailed information about a specific seller"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Seller found",
            content = @Content(schema = @Schema(implementation = SellerResponse.class))
        ),
        @ApiResponse(
            responseCode = "404",
            description = "Seller not found"
        )
    })
    public ResponseEntity<SellerResponse> getSellerById(
            @Parameter(description = "Seller ID", required = true)
            @PathVariable String sellerId) {
        SellerResponse response = sellerService.getSellerById(sellerId);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/email/{email}")
    @Operation(
        summary = "Get seller by email",
        description = "Retrieve seller information using their email address"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Seller found",
            content = @Content(schema = @Schema(implementation = SellerResponse.class))
        ),
        @ApiResponse(
            responseCode = "404",
            description = "Seller not found"
        )
    })
    public ResponseEntity<SellerResponse> getSellerByEmail(
            @Parameter(description = "Seller email", required = true)
            @PathVariable String email) {
        SellerResponse response = sellerService.getSellerByEmail(email);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping
    @Operation(
        summary = "Get all sellers",
        description = "Retrieve a list of all registered sellers"
    )
    @ApiResponse(
        responseCode = "200",
        description = "List of sellers retrieved successfully"
    )
    public ResponseEntity<List<SellerResponse>> getAllSellers() {
        List<SellerResponse> sellers = sellerService.getAllSellers();
        return ResponseEntity.ok(sellers);
    }
    
    @PutMapping("/{sellerId}")
    @Operation(
        summary = "Update seller details",
        description = "Update seller information including payment details (Admin only)"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Seller updated successfully",
            content = @Content(schema = @Schema(implementation = SellerResponse.class))
        ),
        @ApiResponse(
            responseCode = "404",
            description = "Seller not found"
        ),
        @ApiResponse(
            responseCode = "400",
            description = "Invalid input data"
        )
    })
    public ResponseEntity<SellerResponse> updateSeller(
            @Parameter(description = "Seller ID", required = true)
            @PathVariable String sellerId,
            @Valid @RequestBody UpdateSellerRequest request) {
        SellerResponse response = sellerService.updateSeller(sellerId, request);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/{sellerId}/referrals")
    @Operation(
        summary = "Get seller's referral information",
        description = "Retrieve complete referral information including the seller's referral code, " +
                      "who referred them, and all sellers they have referred"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Referral information retrieved successfully",
            content = @Content(schema = @Schema(implementation = ReferralInfoResponse.class))
        ),
        @ApiResponse(
            responseCode = "404",
            description = "Seller not found"
        )
    })
    public ResponseEntity<ReferralInfoResponse> getReferralInfo(
            @Parameter(description = "Seller ID", required = true)
            @PathVariable String sellerId) {
        ReferralInfoResponse response = sellerService.getReferralInfo(sellerId);
        return ResponseEntity.ok(response);
    }
}

