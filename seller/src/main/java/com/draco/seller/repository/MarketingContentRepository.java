package com.draco.seller.repository;

import com.draco.seller.entity.MarketingContent;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MarketingContentRepository extends MongoRepository<MarketingContent, String> {
    
    List<MarketingContent> findByActiveTrue();
    
    List<MarketingContent> findByCategory(String category);
    
    List<MarketingContent> findByContentType(MarketingContent.ContentType contentType);
    
    List<MarketingContent> findByCategoryAndActiveTrue(String category, Boolean active);
    
    List<MarketingContent> findByActiveTrueOrderByCreatedAtDesc();
}

