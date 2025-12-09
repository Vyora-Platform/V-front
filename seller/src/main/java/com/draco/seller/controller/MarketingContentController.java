package com.draco.seller.controller;

import com.draco.seller.dto.content.MarketingContentRequest;
import com.draco.seller.dto.content.MarketingContentResponse;
import com.draco.seller.entity.MarketingContent;
import com.draco.seller.service.FileStorageService;
import com.draco.seller.service.MarketingContentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api/v1/marketing-content")
@RequiredArgsConstructor
@Tag(name = "Marketing Content", description = "APIs for accessing marketing content library")
@SecurityRequirement(name = "Bearer Authentication")
public class MarketingContentController {
    
    private final MarketingContentService marketingContentService;
    private final FileStorageService fileStorageService;
    
    @Value("${server.port:8181}")
    private String serverPort;
    
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Upload marketing content", description = "Upload new marketing content with file (Admin only)")
    public ResponseEntity<MarketingContentResponse> uploadContent(
            @RequestParam("file") MultipartFile file,
            @RequestParam("title") String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam("category") String category,
            @RequestParam("contentType") String contentType,
            @RequestParam(value = "tags", required = false) String tags) {
        
        try {
            // Validate file
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().build();
            }
            
            // Validate content type matches file
            String mimeType = file.getContentType();
            MarketingContent.ContentType type = MarketingContent.ContentType.valueOf(contentType);
            
            // Store file
            String filename = fileStorageService.storeFile(file);
            // Use relative path - works for both localhost and production
            String fileUrl = "/uploads/" + filename;
            
            // Auto-generate thumbnail URL based on content type
            String thumbnailUrl = fileUrl; // For images, use the file itself
            if (type == MarketingContent.ContentType.VIDEO) {
                // For videos, use a default video thumbnail icon URL
                thumbnailUrl = "https://via.placeholder.com/400x300/667eea/ffffff?text=Video";
            } else if (type == MarketingContent.ContentType.PDF) {
                // For PDFs, use a default PDF thumbnail icon URL
                thumbnailUrl = "https://via.placeholder.com/400x300/dc2626/ffffff?text=PDF";
            }
            
            // Create content request
            MarketingContentRequest request = MarketingContentRequest.builder()
                    .title(title)
                    .description(description)
                    .category(category)
                    .contentType(type)
                    .url(fileUrl)
                    .thumbnailUrl(thumbnailUrl)
                    .textContent("")
                    .tags(tags != null ? Arrays.asList(tags.split(",")) : List.of())
                    .fileSize(file.getSize())
                    .mimeType(mimeType)
                    .build();
            
            MarketingContentResponse response = marketingContentService.createContent(request);
            return new ResponseEntity<>(response, HttpStatus.CREATED);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping
    @Operation(summary = "Get all marketing content", description = "Get all marketing materials (active and inactive for admins, only active for sellers)")
    public ResponseEntity<List<MarketingContentResponse>> getAllContent() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"));
        
        List<MarketingContentResponse> content;
        if (isAdmin) {
            // Admins see all content (active and inactive)
            content = marketingContentService.getAllContent();
        } else {
            // Sellers see only active content
            content = marketingContentService.getAllActiveContent();
        }
        return ResponseEntity.ok(content);
    }
    
    @GetMapping("/category/{category}")
    @Operation(summary = "Get content by category", description = "Filter marketing content by category")
    public ResponseEntity<List<MarketingContentResponse>> getContentByCategory(@PathVariable String category) {
        List<MarketingContentResponse> content = marketingContentService.getContentByCategory(category);
        return ResponseEntity.ok(content);
    }
    
    @GetMapping("/type/{type}")
    @Operation(summary = "Get content by type", description = "Filter marketing content by type (TEXT, IMAGE, VIDEO, PDF, LINK)")
    public ResponseEntity<List<MarketingContentResponse>> getContentByType(@PathVariable MarketingContent.ContentType type) {
        List<MarketingContentResponse> content = marketingContentService.getContentByType(type);
        return ResponseEntity.ok(content);
    }
    
    @GetMapping("/{contentId}")
    @Operation(summary = "Get content by ID", description = "Get specific marketing content (increments view count)")
    public ResponseEntity<MarketingContentResponse> getContentById(@PathVariable String contentId) {
        MarketingContentResponse content = marketingContentService.getContentById(contentId);
        return ResponseEntity.ok(content);
    }
    
    @PostMapping("/{contentId}/download")
    @Operation(summary = "Track download", description = "Increment download count for content")
    public ResponseEntity<Void> trackDownload(@PathVariable String contentId) {
        marketingContentService.incrementDownloadCount(contentId);
        return ResponseEntity.ok().build();
    }
    
    @PostMapping("/{contentId}/share")
    @Operation(summary = "Track share", description = "Increment share count for content")
    public ResponseEntity<Void> trackShare(@PathVariable String contentId) {
        marketingContentService.incrementShareCount(contentId);
        return ResponseEntity.ok().build();
    }
    
    @PutMapping("/{contentId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update marketing content", description = "Update marketing content metadata (Admin only)")
    public ResponseEntity<MarketingContentResponse> updateContent(
            @PathVariable String contentId,
            @RequestBody MarketingContentRequest request) {
        MarketingContentResponse response = marketingContentService.updateContent(contentId, request);
        return ResponseEntity.ok(response);
    }
    
    @PutMapping("/{contentId}/status")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update content status", description = "Toggle content active/inactive status (Admin only)")
    public ResponseEntity<MarketingContentResponse> updateContentStatus(
            @PathVariable String contentId,
            @RequestBody java.util.Map<String, Boolean> statusUpdate) {
        Boolean active = statusUpdate.get("active");
        if (active == null) {
            return ResponseEntity.badRequest().build();
        }
        MarketingContentResponse response = marketingContentService.updateContentStatus(contentId, active);
        return ResponseEntity.ok(response);
    }
    
    @DeleteMapping("/{contentId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete marketing content", description = "Delete marketing content (Admin only)")
    public ResponseEntity<Void> deleteContent(@PathVariable String contentId) {
        marketingContentService.deleteContent(contentId);
        return ResponseEntity.noContent().build();
    }
}

