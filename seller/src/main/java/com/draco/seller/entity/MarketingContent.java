package com.draco.seller.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "marketing_content")
public class MarketingContent {
    
    @Id
    private String id;
    
    private String title;
    
    private String description;
    
    @Indexed
    private ContentType contentType;
    
    @Indexed
    private String category;
    
    // URL or file path for the content
    private String contentUrl;
    
    // Thumbnail for videos/images
    private String thumbnailUrl;
    
    // For text content
    private String textContent;
    
    @Builder.Default
    private List<String> tags = new ArrayList<>();
    
    @Indexed
    private String uploadedBy; // Admin ID who uploaded
    
    private Long fileSize; // in bytes
    
    private String mimeType;
    
    @Builder.Default
    private Integer downloadCount = 0;
    
    @Builder.Default
    private Integer viewCount = 0;
    
    @Builder.Default
    private Integer shareCount = 0;
    
    private Boolean active;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    public enum ContentType {
        TEXT,
        IMAGE,
        VIDEO,
        PDF,
        LINK
    }
}

