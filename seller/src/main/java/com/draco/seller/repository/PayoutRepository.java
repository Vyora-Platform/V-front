package com.draco.seller.repository;

import com.draco.seller.entity.Payout;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PayoutRepository extends MongoRepository<Payout, String> {
    
    List<Payout> findBySellerId(String sellerId);
    
    List<Payout> findByStatus(Payout.PayoutStatus status);
    
    List<Payout> findBySellerIdOrderByCreatedAtDesc(String sellerId);
    
    List<Payout> findByStatusOrderByCreatedAtDesc(Payout.PayoutStatus status);
    
    List<Payout> findAllByOrderByCreatedAtDesc();
    
    List<Payout> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
    
    List<Payout> findBySellerIdAndStatus(String sellerId, Payout.PayoutStatus status);
    
    Optional<Payout> findByReferenceNumber(String referenceNumber);
}

