package com.draco.seller.repository;

import com.draco.seller.entity.Customer;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerRepository extends MongoRepository<Customer, String> {
    
    Optional<Customer> findByEmail(String email);
    
    boolean existsByEmail(String email);
    
    List<Customer> findBySellerId(String sellerId);
    
    List<Customer> findByIdIn(List<String> ids);
    
    long countBySellerId(String sellerId);
}

