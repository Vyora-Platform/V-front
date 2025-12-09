package com.draco.seller.controller;

import com.draco.seller.entity.Seller;
import com.draco.seller.exception.ResourceNotFoundException;
import com.draco.seller.repository.SellerRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/webhook")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Webhook", description = "Webhook endpoints for external integrations")
public class WebhookController {

    private final SellerRepository sellerRepository;

    @GetMapping("/seller/{uniqueCode}")
    @Operation(
        summary = "Get seller by unique code (Webhook)",
        description = "Public webhook endpoint to fetch seller information by their unique referral code. No authentication required."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Seller found"),
        @ApiResponse(responseCode = "404", description = "Seller not found with the provided unique code")
    })
    public ResponseEntity<Map<String, Object>> getSellerByUniqueCode(
            @Parameter(description = "Seller unique referral code", required = true)
            @PathVariable String uniqueCode) {
        
        log.info("Webhook request to fetch seller by unique code: {}", uniqueCode);
        
        Seller seller = sellerRepository.findByReferralCode(uniqueCode)
                .orElseThrow(() -> {
                    log.warn("Seller not found with unique code: {}", uniqueCode);
                    return new ResourceNotFoundException("Seller not found with unique code: " + uniqueCode);
                });

        // Build webhook response
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Seller found successfully");
        response.put("data", buildSellerWebhookResponse(seller));
        
        log.info("Webhook response sent for seller: {} with code: {}", seller.getId(), uniqueCode);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/seller/{uniqueCode}")
    @Operation(
        summary = "Get seller by unique code (POST Webhook)",
        description = "POST webhook endpoint to fetch seller information by their unique referral code. Accepts POST requests with optional body."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Seller found"),
        @ApiResponse(responseCode = "404", description = "Seller not found with the provided unique code")
    })
    public ResponseEntity<Map<String, Object>> getSellerByUniqueCodePost(
            @Parameter(description = "Seller unique referral code", required = true)
            @PathVariable String uniqueCode,
            @RequestBody(required = false) Map<String, Object> webhookPayload) {
        
        log.info("POST Webhook request to fetch seller by unique code: {}", uniqueCode);
        if (webhookPayload != null) {
            log.debug("Webhook payload: {}", webhookPayload);
        }
        
        Seller seller = sellerRepository.findByReferralCode(uniqueCode)
                .orElseThrow(() -> {
                    log.warn("Seller not found with unique code: {}", uniqueCode);
                    return new ResourceNotFoundException("Seller not found with unique code: " + uniqueCode);
                });

        // Build webhook response
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Seller found successfully");
        response.put("data", buildSellerWebhookResponse(seller));
        response.put("timestamp", java.time.LocalDateTime.now().toString());
        
        log.info("POST Webhook response sent for seller: {} with code: {}", seller.getId(), uniqueCode);
        return ResponseEntity.ok(response);
    }

    private Map<String, Object> buildSellerWebhookResponse(Seller seller) {
        Map<String, Object> sellerData = new HashMap<>();
        sellerData.put("id", seller.getId());
        sellerData.put("name", seller.getName());
        sellerData.put("email", seller.getEmail());
        sellerData.put("phoneNumber", seller.getPhoneNumber());
        sellerData.put("uniqueCode", seller.getReferralCode());
        sellerData.put("businessName", seller.getBusinessName());
        sellerData.put("businessType", seller.getBusinessType());
        sellerData.put("status", seller.getStatus() != null ? seller.getStatus().name() : null);
        sellerData.put("totalCustomers", seller.getTotalCustomers() != null ? seller.getTotalCustomers() : 0);
        sellerData.put("totalReferrals", seller.getTotalReferrals() != null ? seller.getTotalReferrals() : 0);
        sellerData.put("createdAt", seller.getCreatedAt() != null ? seller.getCreatedAt().toString() : null);
        sellerData.put("updatedAt", seller.getUpdatedAt() != null ? seller.getUpdatedAt().toString() : null);
        
        // Payment information (if available)
        if (seller.getPaymentMethod() != null) {
            Map<String, Object> paymentInfo = new HashMap<>();
            paymentInfo.put("paymentMethod", seller.getPaymentMethod());
            paymentInfo.put("bankName", seller.getBankName());
            paymentInfo.put("accountHolderName", seller.getAccountHolderName());
            paymentInfo.put("upiId", seller.getUpiId());
            sellerData.put("paymentInfo", paymentInfo);
        }
        
        return sellerData;
    }
}

