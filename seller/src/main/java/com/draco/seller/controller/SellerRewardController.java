package com.draco.seller.controller;

import com.draco.seller.dto.SellerRewardRequest;
import com.draco.seller.dto.SellerRewardResponse;
import com.draco.seller.dto.SellerTotalEarnedResponse;
import com.draco.seller.service.SellerRewardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/webhook/rewards")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Seller Rewards Webhook", description = "Public webhook APIs for seller reward management")
public class SellerRewardController {

    private final SellerRewardService sellerRewardService;

    @PostMapping("/create")
    @Operation(
        summary = "Create seller reward (Public Webhook)",
        description = "Public webhook endpoint to create a reward entry for a seller. Fetches seller by unique code and creates reward entry."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Reward created successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid input data"),
        @ApiResponse(responseCode = "404", description = "Seller not found with the provided unique code")
    })
    public ResponseEntity<SellerRewardResponse> createReward(
            @Valid @RequestBody SellerRewardRequest request) {
        
        log.info("Webhook request to create reward: {}", request);
        SellerRewardResponse response = sellerRewardService.createReward(request);
        return ResponseEntity.status(201).body(response);
    }

    @GetMapping("/seller/{sellerUniqueCode}/total")
    @Operation(
        summary = "Get seller total earned points (Public Webhook)",
        description = "Public webhook endpoint to get total earned points for a seller. Supports optional pagination."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Total earned points retrieved successfully"),
        @ApiResponse(responseCode = "404", description = "Seller not found with the provided unique code")
    })
    public ResponseEntity<SellerTotalEarnedResponse> getSellerTotalEarned(
            @Parameter(description = "Seller unique referral code", required = true)
            @PathVariable String sellerUniqueCode,
            @Parameter(description = "Page number (0-indexed). If not provided, returns without pagination")
            @RequestParam(required = false) Integer page,
            @Parameter(description = "Page size. If not provided, returns without pagination")
            @RequestParam(required = false) Integer size) {
        
        log.info("Webhook request to get total earned for seller: {} (page: {}, size: {})", 
                sellerUniqueCode, page, size);
        
        SellerTotalEarnedResponse response = sellerRewardService.getSellerTotalEarned(
                sellerUniqueCode, page, size);
        return ResponseEntity.ok(response);
    }
}

