package com.draco.seller.dto.content;

import com.draco.seller.entity.MarketingContent;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Marketing content response")
public class MarketingContentResponse {
    
    private String id;
    private String title;
    private String description;
    private MarketingContent.ContentType contentType;
    private String category;
    private String contentUrl;
    private String thumbnailUrl;
    private String textContent;
    private List<String> tags;
    private String uploadedBy;
    private Long fileSize;
    private String mimeType;
    private Integer downloadCount;
    private Integer viewCount;
    private Integer shareCount;
    private Boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

