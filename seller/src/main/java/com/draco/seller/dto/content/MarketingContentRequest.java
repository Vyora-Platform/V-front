package com.draco.seller.dto.content;

import com.draco.seller.entity.MarketingContent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MarketingContentRequest {
    
    @NotBlank(message = "Title is required")
    private String title;
    
    private String description;
    
    @NotNull(message = "Content type is required")
    private MarketingContent.ContentType contentType;
    
    @NotBlank(message = "Category is required")
    private String category;
    
    @NotBlank(message = "Content URL is required")
    private String url;
    
    private String thumbnailUrl;
    
    private String textContent;
    
    @Builder.Default
    private List<String> tags = new ArrayList<>();
    
    private Long fileSize;
    
    private String mimeType;
}

