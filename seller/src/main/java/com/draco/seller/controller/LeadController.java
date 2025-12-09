package com.draco.seller.controller;

import com.draco.seller.dto.lead.BulkLeadAssignRequest;
import com.draco.seller.dto.lead.BulkLeadUploadResult;
import com.draco.seller.dto.lead.LeadRequest;
import com.draco.seller.dto.lead.LeadResponse;
import com.draco.seller.entity.User;
import com.draco.seller.service.LeadService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/leads")
@RequiredArgsConstructor
@Tag(name = "Leads Management", description = "APIs for managing sales leads")
@SecurityRequirement(name = "Bearer Authentication")
public class LeadController {
    
    private final LeadService leadService;
    
    @PostMapping
    @Operation(summary = "Create a new lead", description = "Add a new sales lead")
    public ResponseEntity<LeadResponse> createLead(
            @Valid @RequestBody LeadRequest request,
            Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        LeadResponse response = leadService.createLead(user.getSellerId(), request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }
    
    @GetMapping
    @Operation(summary = "Get all leads", description = "Get all leads for the authenticated seller")
    public ResponseEntity<List<LeadResponse>> getMyLeads(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        List<LeadResponse> leads = leadService.getLeadsBySeller(user.getSellerId());
        return ResponseEntity.ok(leads);
    }
    
    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all leads (Admin)", description = "Get all leads across all sellers (Admin only)")
    public ResponseEntity<List<LeadResponse>> getAllLeads() {
        List<LeadResponse> leads = leadService.getAllLeads();
        return ResponseEntity.ok(leads);
    }
    
    @PostMapping("/bulk-assign")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Bulk assign leads (Admin)", description = "Assign multiple leads to a new seller (Admin only)")
    public ResponseEntity<Map<String, Object>> bulkAssignLeads(@Valid @RequestBody BulkLeadAssignRequest request) {
        int count = leadService.bulkAssignLeads(request.getLeadIds(), request.getNewSellerId());
        Map<String, Object> response = new HashMap<>();
        response.put("assignedCount", count);
        response.put("message", count + " lead(s) assigned successfully");
        return ResponseEntity.ok(response);
    }
    
    @PostMapping(value = "/upload-csv", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Upload leads from CSV (Admin)", description = "Upload multiple leads from CSV file and assign to selected sellers (Admin only)")
    public ResponseEntity<BulkLeadUploadResult> uploadLeadsFromCSV(
            @RequestParam("file") MultipartFile file,
            @RequestParam("sellerIds") List<String> sellerIds) {
        
        if (file.isEmpty()) {
            BulkLeadUploadResult errorResult = BulkLeadUploadResult.builder()
                    .totalProcessed(0)
                    .successfullyCreated(0)
                    .failed(0)
                    .build();
            errorResult.getErrors().add("File is empty");
            return ResponseEntity.badRequest().body(errorResult);
        }
        
        if (sellerIds == null || sellerIds.isEmpty()) {
            BulkLeadUploadResult errorResult = BulkLeadUploadResult.builder()
                    .totalProcessed(0)
                    .successfullyCreated(0)
                    .failed(0)
                    .build();
            errorResult.getErrors().add("At least one seller must be selected");
            return ResponseEntity.badRequest().body(errorResult);
        }
        
        BulkLeadUploadResult result = leadService.uploadLeadsFromCSV(file, sellerIds);
        return ResponseEntity.ok(result);
    }
    
    @GetMapping("/{leadId}")
    @Operation(summary = "Get lead by ID", description = "Get specific lead details")
    public ResponseEntity<LeadResponse> getLeadById(
            @PathVariable String leadId,
            Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        LeadResponse lead = leadService.getLeadById(leadId, user.getSellerId());
        return ResponseEntity.ok(lead);
    }
    
    @PutMapping("/{leadId}")
    @Operation(summary = "Update lead", description = "Update lead information")
    public ResponseEntity<LeadResponse> updateLead(
            @PathVariable String leadId,
            @Valid @RequestBody LeadRequest request,
            Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        
        // Check if user is admin
        boolean isAdmin = user.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"));
        
        LeadResponse response;
        if (isAdmin) {
            // Admin can update any lead
            response = leadService.updateLeadByAdmin(leadId, request);
        } else {
            // Seller can only update their own leads
            response = leadService.updateLead(leadId, user.getSellerId(), request);
        }
        
        return ResponseEntity.ok(response);
    }
    
    @DeleteMapping("/{leadId}")
    @Operation(summary = "Delete lead", description = "Delete a lead")
    public ResponseEntity<Void> deleteLead(
            @PathVariable String leadId,
            Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        
        // Check if user is admin
        boolean isAdmin = user.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"));
        
        if (isAdmin) {
            // Admin can delete any lead
            leadService.deleteLeadByAdmin(leadId);
        } else {
            // Seller can only delete their own leads
            leadService.deleteLead(leadId, user.getSellerId());
        }
        
        return ResponseEntity.noContent().build();
    }
}

