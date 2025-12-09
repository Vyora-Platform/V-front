package com.draco.seller.repository;

import com.draco.seller.entity.SellerReward;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SellerRewardRepository extends MongoRepository<SellerReward, String> {
    
    List<SellerReward> findBySellerId(String sellerId);
    
    Page<SellerReward> findBySellerId(String sellerId, Pageable pageable);
    
    List<SellerReward> findByReferrerId(String referrerId);
}

