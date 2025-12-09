package com.draco.seller.controller;

import com.draco.seller.dto.payout.PayoutApprovalRequest;
import com.draco.seller.dto.payout.PayoutRequest;
import com.draco.seller.dto.payout.PayoutResponse;
import com.draco.seller.entity.Payout;
import com.draco.seller.entity.User;
import com.draco.seller.service.PayoutService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/payouts")
@RequiredArgsConstructor
@Tag(name = "Payout Management", description = "APIs for managing seller payouts")
@SecurityRequirement(name = "Bearer Authentication")
public class PayoutController {
    
    private final PayoutService payoutService;
    
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create new payout (Admin)", description = "Create a new payout for a seller")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Payout created successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid input"),
        @ApiResponse(responseCode = "404", description = "Seller not found")
    })
    public ResponseEntity<PayoutResponse> createPayout(@Valid @RequestBody PayoutRequest request) {
        PayoutResponse response = payoutService.createPayout(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }
    
    @GetMapping("/{payoutId}")
    @Operation(summary = "Get payout by ID", description = "Retrieve payout details by ID")
    public ResponseEntity<PayoutResponse> getPayoutById(
            @Parameter(description = "Payout ID") @PathVariable String payoutId) {
        PayoutResponse response = payoutService.getPayoutById(payoutId);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping
    @Operation(summary = "Get payouts", description = "Get payouts for authenticated user")
    public ResponseEntity<List<PayoutResponse>> getPayouts(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        
        // If admin, return all payouts; if seller, return only their payouts
        boolean isAdmin = user.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"));
        
        if (isAdmin) {
            List<PayoutResponse> payouts = payoutService.getAllPayouts();
            return ResponseEntity.ok(payouts);
        } else {
            List<PayoutResponse> payouts = payoutService.getPayoutsBySeller(user.getSellerId());
            return ResponseEntity.ok(payouts);
        }
    }
    
    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all payouts (Admin)", description = "Get all payouts across all sellers")
    public ResponseEntity<List<PayoutResponse>> getAllPayouts() {
        List<PayoutResponse> payouts = payoutService.getAllPayouts();
        return ResponseEntity.ok(payouts);
    }
    
    @GetMapping("/seller/{sellerId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get payouts by seller (Admin)", description = "Get all payouts for a specific seller")
    public ResponseEntity<List<PayoutResponse>> getPayoutsBySeller(
            @Parameter(description = "Seller ID") @PathVariable String sellerId) {
        List<PayoutResponse> payouts = payoutService.getPayoutsBySeller(sellerId);
        return ResponseEntity.ok(payouts);
    }
    
    @GetMapping("/status/{status}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get payouts by status (Admin)", description = "Get all payouts with a specific status")
    public ResponseEntity<List<PayoutResponse>> getPayoutsByStatus(
            @Parameter(description = "Payout status") @PathVariable Payout.PayoutStatus status) {
        List<PayoutResponse> payouts = payoutService.getPayoutsByStatus(status);
        return ResponseEntity.ok(payouts);
    }
    
    @PutMapping("/{payoutId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update payout (Admin)", description = "Update pending payout details")
    public ResponseEntity<PayoutResponse> updatePayout(
            @Parameter(description = "Payout ID") @PathVariable String payoutId,
            @Valid @RequestBody PayoutRequest request) {
        PayoutResponse response = payoutService.updatePayout(payoutId, request);
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/{payoutId}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Approve payout (Admin)", description = "Approve a pending payout")
    public ResponseEntity<PayoutResponse> approvePayout(
            @Parameter(description = "Payout ID") @PathVariable String payoutId,
            Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        PayoutResponse response = payoutService.approvePayout(payoutId, user.getEmail());
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/{payoutId}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Reject payout (Admin)", description = "Reject a pending or approved payout")
    public ResponseEntity<PayoutResponse> rejectPayout(
            @Parameter(description = "Payout ID") @PathVariable String payoutId,
            @RequestBody PayoutApprovalRequest request,
            Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        PayoutResponse response = payoutService.rejectPayout(payoutId, user.getEmail(), request);
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/{payoutId}/paid")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Mark payout as paid (Admin)", description = "Mark an approved payout as paid")
    public ResponseEntity<PayoutResponse> markAsPaid(
            @Parameter(description = "Payout ID") @PathVariable String payoutId,
            @RequestBody PayoutApprovalRequest request,
            Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        PayoutResponse response = payoutService.markAsPaid(payoutId, user.getEmail(), request);
        return ResponseEntity.ok(response);
    }
    
    @DeleteMapping("/{payoutId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete payout (Admin)", description = "Delete a payout (cannot delete paid payouts)")
    public ResponseEntity<Void> deletePayout(
            @Parameter(description = "Payout ID") @PathVariable String payoutId) {
        payoutService.deletePayout(payoutId);
        return ResponseEntity.noContent().build();
    }
}

