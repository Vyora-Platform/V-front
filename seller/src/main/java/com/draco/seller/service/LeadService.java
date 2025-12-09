package com.draco.seller.service;

import com.draco.seller.dto.lead.BulkLeadUploadResult;
import com.draco.seller.dto.lead.LeadRequest;
import com.draco.seller.dto.lead.LeadResponse;
import com.draco.seller.entity.Lead;
import com.draco.seller.exception.ResourceNotFoundException;
import com.draco.seller.repository.LeadRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class LeadService {
    
    private final LeadRepository leadRepository;
    
    @Transactional
    public LeadResponse createLead(String sellerId, LeadRequest request) {
        Lead lead = Lead.builder()
                .name(request.getName())
                .email(request.getEmail())
                .phoneNumber(request.getPhoneNumber())
                .sellerId(sellerId)
                .status(request.getStatus() != null ? request.getStatus() : Lead.LeadStatus.NEW)
                .source(request.getSource() != null ? request.getSource() : Lead.LeadSource.OTHER)
                .notes(request.getNotes())
                .company(request.getCompany())
                .location(request.getLocation())
                .estimatedValue(request.getEstimatedValue())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        
        Lead savedLead = leadRepository.save(lead);
        return mapToResponse(savedLead);
    }
    
    public List<LeadResponse> getLeadsBySeller(String sellerId) {
        return leadRepository.findBySellerId(sellerId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    public List<LeadResponse> getAllLeads() {
        return leadRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public int bulkAssignLeads(List<String> leadIds, String newSellerId) {
        int count = 0;
        for (String leadId : leadIds) {
            try {
                Lead lead = leadRepository.findById(leadId).orElse(null);
                if (lead != null) {
                    lead.setSellerId(newSellerId);
                    lead.setUpdatedAt(LocalDateTime.now());
                    leadRepository.save(lead);
                    count++;
                }
            } catch (Exception e) {
                log.error("Failed to assign lead {}: {}", leadId, e.getMessage());
            }
        }
        log.info("Bulk assigned {} leads to seller {}", count, newSellerId);
        return count;
    }
    
    @Transactional
    public BulkLeadUploadResult uploadLeadsFromCSV(MultipartFile file, List<String> sellerIds) {
        BulkLeadUploadResult result = BulkLeadUploadResult.builder()
                .totalProcessed(0)
                .successfullyCreated(0)
                .failed(0)
                .errors(new ArrayList<>())
                .createdLeadIds(new ArrayList<>())
                .build();
        
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8));
             CSVParser csvParser = new CSVParser(reader, 
                     CSVFormat.Builder.create(CSVFormat.DEFAULT)
                             .setHeader()
                             .setSkipHeaderRecord(true)
                             .setIgnoreHeaderCase(true)
                             .setTrim(true)
                             .build())) {
            
            List<CSVRecord> records = csvParser.getRecords();
            result.setTotalProcessed(records.size());
            
            // Distribute leads evenly across selected sellers
            int sellerIndex = 0;
            
            for (CSVRecord record : records) {
                try {
                    // Get the seller for this lead (round-robin distribution)
                    String sellerId = sellerIds.get(sellerIndex % sellerIds.size());
                    sellerIndex++;
                    
                    // Parse CSV record
                    String name = getFieldValue(record, "name", "Name");
                    String email = getFieldValue(record, "email", "Email");
                    String phoneNumber = getFieldValue(record, "phone", "Phone", "PhoneNumber");
                    String company = getFieldValue(record, "company", "Company");
                    String location = getFieldValue(record, "location", "Location");
                    String notesField = getFieldValue(record, "notes", "Notes");
                    String statusField = getFieldValue(record, "status", "Status");
                    String sourceField = getFieldValue(record, "source", "Source");
                    String valueField = getFieldValue(record, "value", "Value", "EstimatedValue");
                    
                    // Validate required fields
                    if (name == null || name.trim().isEmpty()) {
                        result.setFailed(result.getFailed() + 1);
                        result.getErrors().add("Row " + record.getRecordNumber() + ": Name is required");
                        continue;
                    }
                    
                    // Parse status
                    Lead.LeadStatus status = Lead.LeadStatus.NEW;
                    if (statusField != null && !statusField.isEmpty()) {
                        try {
                            status = Lead.LeadStatus.valueOf(statusField.toUpperCase());
                        } catch (IllegalArgumentException e) {
                            // Use default NEW if invalid
                        }
                    }
                    
                    // Parse source
                    Lead.LeadSource source = Lead.LeadSource.OTHER;
                    if (sourceField != null && !sourceField.isEmpty()) {
                        try {
                            source = Lead.LeadSource.valueOf(sourceField.toUpperCase().replace(" ", "_"));
                        } catch (IllegalArgumentException e) {
                            // Use default OTHER if invalid
                        }
                    }
                    
                    // Parse estimated value
                    Double estimatedValue = null;
                    if (valueField != null && !valueField.isEmpty()) {
                        try {
                            estimatedValue = Double.parseDouble(valueField.replace("$", "").replace(",", "").trim());
                        } catch (NumberFormatException e) {
                            // Leave as null if invalid
                        }
                    }
                    
                    // Create lead
                    Lead lead = Lead.builder()
                            .name(name.trim())
                            .email(email != null ? email.trim() : null)
                            .phoneNumber(phoneNumber != null ? phoneNumber.trim() : null)
                            .sellerId(sellerId)
                            .status(status)
                            .source(source)
                            .company(company != null ? company.trim() : null)
                            .location(location != null ? location.trim() : null)
                            .notes(notesField != null ? notesField.trim() : null)
                            .estimatedValue(estimatedValue)
                            .createdAt(LocalDateTime.now())
                            .updatedAt(LocalDateTime.now())
                            .build();
                    
                    Lead savedLead = leadRepository.save(lead);
                    result.setSuccessfullyCreated(result.getSuccessfullyCreated() + 1);
                    result.getCreatedLeadIds().add(savedLead.getId());
                    
                } catch (Exception e) {
                    result.setFailed(result.getFailed() + 1);
                    result.getErrors().add("Row " + record.getRecordNumber() + ": " + e.getMessage());
                    log.error("Failed to create lead from CSV row {}: {}", record.getRecordNumber(), e.getMessage());
                }
            }
            
            log.info("CSV Upload Complete: {} total, {} successful, {} failed", 
                    result.getTotalProcessed(), result.getSuccessfullyCreated(), result.getFailed());
            
        } catch (Exception e) {
            log.error("Failed to parse CSV file: {}", e.getMessage());
            result.getErrors().add("Failed to parse CSV file: " + e.getMessage());
        }
        
        return result;
    }
    
    private String getFieldValue(CSVRecord record, String... possibleNames) {
        for (String name : possibleNames) {
            try {
                if (record.isMapped(name)) {
                    String value = record.get(name);
                    if (value != null && !value.trim().isEmpty()) {
                        return value;
                    }
                }
            } catch (IllegalArgumentException e) {
                // Column doesn't exist, try next name
            }
        }
        return null;
    }
    
    public LeadResponse getLeadById(String leadId, String sellerId) {
        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new ResourceNotFoundException("Lead not found"));
        
        if (!lead.getSellerId().equals(sellerId)) {
            throw new ResourceNotFoundException("Lead not found");
        }
        
        return mapToResponse(lead);
    }
    
    @Transactional
    public LeadResponse updateLead(String leadId, String sellerId, LeadRequest request) {
        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new ResourceNotFoundException("Lead not found"));
        
        if (!lead.getSellerId().equals(sellerId)) {
            throw new ResourceNotFoundException("Lead not found");
        }
        
        lead.setName(request.getName());
        lead.setEmail(request.getEmail());
        lead.setPhoneNumber(request.getPhoneNumber());
        lead.setStatus(request.getStatus());
        lead.setSource(request.getSource());
        lead.setNotes(request.getNotes());
        lead.setCompany(request.getCompany());
        lead.setLocation(request.getLocation());
        lead.setEstimatedValue(request.getEstimatedValue());
        lead.setUpdatedAt(LocalDateTime.now());
        
        Lead updatedLead = leadRepository.save(lead);
        log.info("Lead updated: {} by seller: {}", leadId, sellerId);
        return mapToResponse(updatedLead);
    }
    
    @Transactional
    public LeadResponse updateLeadByAdmin(String leadId, LeadRequest request) {
        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new ResourceNotFoundException("Lead not found"));
        
        lead.setName(request.getName());
        lead.setEmail(request.getEmail());
        lead.setPhoneNumber(request.getPhoneNumber());
        lead.setSellerId(request.getSellerId()); // Admin can change seller
        lead.setStatus(request.getStatus());
        lead.setSource(request.getSource());
        lead.setNotes(request.getNotes());
        lead.setCompany(request.getCompany());
        lead.setLocation(request.getLocation());
        lead.setEstimatedValue(request.getEstimatedValue());
        lead.setUpdatedAt(LocalDateTime.now());
        
        Lead updatedLead = leadRepository.save(lead);
        log.info("Lead updated by admin: {}", leadId);
        return mapToResponse(updatedLead);
    }
    
    @Transactional
    public void deleteLead(String leadId, String sellerId) {
        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new ResourceNotFoundException("Lead not found"));
        
        if (!lead.getSellerId().equals(sellerId)) {
            throw new ResourceNotFoundException("Lead not found");
        }
        
        leadRepository.delete(lead);
        log.info("Lead deleted: {} by seller: {}", leadId, sellerId);
    }
    
    @Transactional
    public void deleteLeadByAdmin(String leadId) {
        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new ResourceNotFoundException("Lead not found"));
        
        leadRepository.delete(lead);
        log.info("Lead deleted by admin: {}", leadId);
    }
    
    private LeadResponse mapToResponse(Lead lead) {
        return LeadResponse.builder()
                .id(lead.getId())
                .name(lead.getName())
                .email(lead.getEmail())
                .phoneNumber(lead.getPhoneNumber())
                .sellerId(lead.getSellerId())
                .status(lead.getStatus())
                .source(lead.getSource())
                .notes(lead.getNotes())
                .company(lead.getCompany())
                .location(lead.getLocation())
                .estimatedValue(lead.getEstimatedValue())
                .lastContactedAt(lead.getLastContactedAt())
                .createdAt(lead.getCreatedAt())
                .updatedAt(lead.getUpdatedAt())
                .build();
    }
}

