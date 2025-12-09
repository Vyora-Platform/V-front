package com.draco.seller.repository;

import com.draco.seller.entity.Lead;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LeadRepository extends MongoRepository<Lead, String> {
    
    List<Lead> findBySellerId(String sellerId);
    
    List<Lead> findBySellerIdAndStatus(String sellerId, Lead.LeadStatus status);
    
    long countBySellerId(String sellerId);
    
    long countBySellerIdAndStatus(String sellerId, Lead.LeadStatus status);
}

