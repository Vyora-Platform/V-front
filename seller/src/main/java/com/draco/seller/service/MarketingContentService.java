package com.draco.seller.service;

import com.draco.seller.dto.content.MarketingContentRequest;
import com.draco.seller.dto.content.MarketingContentResponse;
import com.draco.seller.entity.MarketingContent;
import com.draco.seller.exception.ResourceNotFoundException;
import com.draco.seller.repository.MarketingContentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MarketingContentService {
    
    private final MarketingContentRepository marketingContentRepository;
    
    @Transactional
    public MarketingContentResponse createContent(MarketingContentRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String uploadedBy = authentication != null ? authentication.getName() : "SYSTEM";
        
        MarketingContent content = MarketingContent.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .contentType(request.getContentType())
                .category(request.getCategory())
                .contentUrl(request.getUrl())
                .thumbnailUrl(request.getThumbnailUrl())
                .textContent(request.getTextContent())
                .tags(request.getTags())
                .uploadedBy(uploadedBy)
                .fileSize(request.getFileSize())
                .mimeType(request.getMimeType())
                .downloadCount(0)
                .viewCount(0)
                .shareCount(0)
                .active(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        
        MarketingContent savedContent = marketingContentRepository.save(content);
        log.info("Marketing content created: {} by {}", savedContent.getId(), uploadedBy);
        
        return mapToResponse(savedContent);
    }
    
    public List<MarketingContentResponse> getAllContent() {
        return marketingContentRepository.findAll().stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    public List<MarketingContentResponse> getAllActiveContent() {
        return marketingContentRepository.findByActiveTrueOrderByCreatedAtDesc().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    public List<MarketingContentResponse> getContentByCategory(String category) {
        return marketingContentRepository.findByCategoryAndActiveTrue(category, true).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    public List<MarketingContentResponse> getContentByType(MarketingContent.ContentType contentType) {
        return marketingContentRepository.findByContentType(contentType).stream()
                .filter(MarketingContent::getActive)
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    public MarketingContentResponse getContentById(String contentId) {
        MarketingContent content = marketingContentRepository.findById(contentId)
                .orElseThrow(() -> new ResourceNotFoundException("Content not found"));
        
        // Increment view count
        content.setViewCount(content.getViewCount() + 1);
        marketingContentRepository.save(content);
        
        return mapToResponse(content);
    }
    
    @Transactional
    public void incrementDownloadCount(String contentId) {
        MarketingContent content = marketingContentRepository.findById(contentId)
                .orElseThrow(() -> new ResourceNotFoundException("Content not found"));
        
        content.setDownloadCount(content.getDownloadCount() + 1);
        marketingContentRepository.save(content);
    }
    
    @Transactional
    public void incrementShareCount(String contentId) {
        MarketingContent content = marketingContentRepository.findById(contentId)
                .orElseThrow(() -> new ResourceNotFoundException("Content not found"));
        
        content.setShareCount(content.getShareCount() + 1);
        marketingContentRepository.save(content);
    }
    
    @Transactional
    public MarketingContentResponse updateContent(String contentId, MarketingContentRequest request) {
        MarketingContent content = marketingContentRepository.findById(contentId)
                .orElseThrow(() -> new ResourceNotFoundException("Content not found"));
        
        // Update only metadata fields (title, description, category, tags)
        // Content type and URLs remain unchanged
        if (request.getTitle() != null) {
            content.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            content.setDescription(request.getDescription());
        }
        if (request.getCategory() != null) {
            content.setCategory(request.getCategory());
        }
        if (request.getTags() != null) {
            content.setTags(request.getTags());
        }
        
        content.setUpdatedAt(LocalDateTime.now());
        
        MarketingContent updatedContent = marketingContentRepository.save(content);
        log.info("Marketing content updated: {}", contentId);
        
        return mapToResponse(updatedContent);
    }
    
    @Transactional
    public MarketingContentResponse updateContentStatus(String contentId, Boolean active) {
        MarketingContent content = marketingContentRepository.findById(contentId)
                .orElseThrow(() -> new ResourceNotFoundException("Content not found"));
        
        content.setActive(active);
        content.setUpdatedAt(LocalDateTime.now());
        
        MarketingContent updatedContent = marketingContentRepository.save(content);
        log.info("Marketing content status updated: {} - Active: {}", contentId, active);
        
        return mapToResponse(updatedContent);
    }
    
    @Transactional
    public void deleteContent(String contentId) {
        MarketingContent content = marketingContentRepository.findById(contentId)
                .orElseThrow(() -> new ResourceNotFoundException("Content not found"));
        
        marketingContentRepository.delete(content);
        log.info("Marketing content deleted: {}", contentId);
    }
    
    private MarketingContentResponse mapToResponse(MarketingContent content) {
        return MarketingContentResponse.builder()
                .id(content.getId())
                .title(content.getTitle())
                .description(content.getDescription())
                .contentType(content.getContentType())
                .category(content.getCategory())
                .contentUrl(content.getContentUrl())
                .thumbnailUrl(content.getThumbnailUrl())
                .textContent(content.getTextContent())
                .tags(content.getTags())
                .uploadedBy(content.getUploadedBy())
                .fileSize(content.getFileSize())
                .mimeType(content.getMimeType())
                .downloadCount(content.getDownloadCount())
                .viewCount(content.getViewCount())
                .shareCount(content.getShareCount())
                .active(content.getActive())
                .createdAt(content.getCreatedAt())
                .updatedAt(content.getUpdatedAt())
                .build();
    }
}

