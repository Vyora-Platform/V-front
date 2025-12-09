package com.draco.seller.repository;

import com.draco.seller.entity.Seller;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SellerRepository extends MongoRepository<Seller, String> {
    
    Optional<Seller> findByEmail(String email);
    
    Optional<Seller> findByReferralCode(String referralCode);
    
    boolean existsByEmail(String email);
    
    boolean existsByReferralCode(String referralCode);
    
    List<Seller> findByReferredBy(String referredBy);
    
    List<Seller> findByIdIn(List<String> ids);
}

