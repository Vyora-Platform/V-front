package com.draco.seller.service;

import com.draco.seller.dto.payout.PayoutApprovalRequest;
import com.draco.seller.dto.payout.PayoutRequest;
import com.draco.seller.dto.payout.PayoutResponse;
import com.draco.seller.entity.Payout;
import com.draco.seller.entity.Seller;
import com.draco.seller.exception.ResourceNotFoundException;
import com.draco.seller.repository.PayoutRepository;
import com.draco.seller.repository.SellerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PayoutService {
    
    private final PayoutRepository payoutRepository;
    private final SellerRepository sellerRepository;
    
    @Transactional
    public PayoutResponse createPayout(PayoutRequest request) {
        // Validate seller exists
        Seller seller = sellerRepository.findById(request.getSellerId())
                .orElseThrow(() -> new ResourceNotFoundException("Seller not found"));
        
        // Generate reference number
        String referenceNumber = "PAY-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        
        Payout payout = Payout.builder()
                .sellerId(request.getSellerId())
                .sellerName(seller.getName())
                .sellerEmail(seller.getEmail())
                .amount(request.getAmount())
                .currency(request.getCurrency() != null ? request.getCurrency() : "INR")
                .status(Payout.PayoutStatus.PENDING)
                .paymentMethod(request.getPaymentMethod())
                .paymentDetails(request.getPaymentDetails())
                .referenceNumber(referenceNumber)
                .description(request.getDescription())
                .notes(request.getNotes())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        
        Payout savedPayout = payoutRepository.save(payout);
        log.info("Payout created: {} for seller: {} amount: {}", 
                savedPayout.getId(), seller.getName(), request.getAmount());
        
        return mapToResponse(savedPayout);
    }
    
    public PayoutResponse getPayoutById(String payoutId) {
        Payout payout = payoutRepository.findById(payoutId)
                .orElseThrow(() -> new ResourceNotFoundException("Payout not found"));
        return mapToResponse(payout);
    }
    
    public List<PayoutResponse> getAllPayouts() {
        return payoutRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    public List<PayoutResponse> getPayoutsBySeller(String sellerId) {
        return payoutRepository.findBySellerIdOrderByCreatedAtDesc(sellerId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    public List<PayoutResponse> getPayoutsByStatus(Payout.PayoutStatus status) {
        return payoutRepository.findByStatusOrderByCreatedAtDesc(status).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public PayoutResponse approvePayout(String payoutId, String approvedBy) {
        Payout payout = payoutRepository.findById(payoutId)
                .orElseThrow(() -> new ResourceNotFoundException("Payout not found"));
        
        if (payout.getStatus() != Payout.PayoutStatus.PENDING) {
            throw new IllegalStateException("Only pending payouts can be approved");
        }
        
        payout.setStatus(Payout.PayoutStatus.APPROVED);
        payout.setApprovedBy(approvedBy);
        payout.setApprovedAt(LocalDateTime.now());
        payout.setUpdatedAt(LocalDateTime.now());
        
        Payout updated = payoutRepository.save(payout);
        log.info("Payout approved: {} by: {}", payoutId, approvedBy);
        
        return mapToResponse(updated);
    }
    
    @Transactional
    public PayoutResponse rejectPayout(String payoutId, String rejectedBy, PayoutApprovalRequest request) {
        Payout payout = payoutRepository.findById(payoutId)
                .orElseThrow(() -> new ResourceNotFoundException("Payout not found"));
        
        if (payout.getStatus() != Payout.PayoutStatus.PENDING && 
            payout.getStatus() != Payout.PayoutStatus.APPROVED) {
            throw new IllegalStateException("Only pending or approved payouts can be rejected");
        }
        
        payout.setStatus(Payout.PayoutStatus.REJECTED);
        payout.setRejectedBy(rejectedBy);
        payout.setRejectedAt(LocalDateTime.now());
        payout.setRejectionReason(request.getRejectionReason());
        if (request.getNotes() != null) {
            payout.setNotes(payout.getNotes() + "\n" + request.getNotes());
        }
        payout.setUpdatedAt(LocalDateTime.now());
        
        Payout updated = payoutRepository.save(payout);
        log.info("Payout rejected: {} by: {} reason: {}", payoutId, rejectedBy, request.getRejectionReason());
        
        return mapToResponse(updated);
    }
    
    @Transactional
    public PayoutResponse markAsPaid(String payoutId, String paidBy, PayoutApprovalRequest request) {
        Payout payout = payoutRepository.findById(payoutId)
                .orElseThrow(() -> new ResourceNotFoundException("Payout not found"));
        
        if (payout.getStatus() != Payout.PayoutStatus.APPROVED && 
            payout.getStatus() != Payout.PayoutStatus.PROCESSING) {
            throw new IllegalStateException("Only approved or processing payouts can be marked as paid");
        }
        
        payout.setStatus(Payout.PayoutStatus.PAID);
        payout.setPaidBy(paidBy);
        payout.setPaidAt(LocalDateTime.now());
        payout.setTransactionId(request.getTransactionId());
        if (request.getNotes() != null) {
            payout.setNotes(payout.getNotes() != null ? payout.getNotes() + "\n" + request.getNotes() : request.getNotes());
        }
        payout.setUpdatedAt(LocalDateTime.now());
        
        Payout updated = payoutRepository.save(payout);
        log.info("Payout marked as paid: {} by: {} transaction: {}", 
                payoutId, paidBy, request.getTransactionId());
        
        return mapToResponse(updated);
    }
    
    @Transactional
    public PayoutResponse updatePayout(String payoutId, PayoutRequest request) {
        Payout payout = payoutRepository.findById(payoutId)
                .orElseThrow(() -> new ResourceNotFoundException("Payout not found"));
        
        if (payout.getStatus() != Payout.PayoutStatus.PENDING) {
            throw new IllegalStateException("Only pending payouts can be updated");
        }
        
        // Update fields
        if (request.getAmount() != null) payout.setAmount(request.getAmount());
        if (request.getDescription() != null) payout.setDescription(request.getDescription());
        if (request.getNotes() != null) payout.setNotes(request.getNotes());
        if (request.getPaymentMethod() != null) payout.setPaymentMethod(request.getPaymentMethod());
        if (request.getPaymentDetails() != null) payout.setPaymentDetails(request.getPaymentDetails());
        
        payout.setUpdatedAt(LocalDateTime.now());
        
        Payout updated = payoutRepository.save(payout);
        log.info("Payout updated: {}", payoutId);
        
        return mapToResponse(updated);
    }
    
    @Transactional
    public void deletePayout(String payoutId) {
        Payout payout = payoutRepository.findById(payoutId)
                .orElseThrow(() -> new ResourceNotFoundException("Payout not found"));
        
        if (payout.getStatus() == Payout.PayoutStatus.PAID) {
            throw new IllegalStateException("Cannot delete paid payouts");
        }
        
        payoutRepository.delete(payout);
        log.info("Payout deleted: {}", payoutId);
    }
    
    private PayoutResponse mapToResponse(Payout payout) {
        return PayoutResponse.builder()
                .id(payout.getId())
                .sellerId(payout.getSellerId())
                .sellerName(payout.getSellerName())
                .sellerEmail(payout.getSellerEmail())
                .amount(payout.getAmount())
                .currency(payout.getCurrency())
                .status(payout.getStatus())
                .paymentMethod(payout.getPaymentMethod())
                .paymentDetails(payout.getPaymentDetails())
                .referenceNumber(payout.getReferenceNumber())
                .description(payout.getDescription())
                .notes(payout.getNotes())
                .approvedBy(payout.getApprovedBy())
                .approvedAt(payout.getApprovedAt())
                .rejectedBy(payout.getRejectedBy())
                .rejectedAt(payout.getRejectedAt())
                .rejectionReason(payout.getRejectionReason())
                .paidBy(payout.getPaidBy())
                .paidAt(payout.getPaidAt())
                .transactionId(payout.getTransactionId())
                .createdAt(payout.getCreatedAt())
                .updatedAt(payout.getUpdatedAt())
                .build();
    }
}

