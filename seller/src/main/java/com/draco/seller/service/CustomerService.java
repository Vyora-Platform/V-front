package com.draco.seller.service;

import com.draco.seller.dto.CustomerRequest;
import com.draco.seller.dto.CustomerResponse;
import com.draco.seller.entity.Customer;
import com.draco.seller.exception.DuplicateResourceException;
import com.draco.seller.exception.ResourceNotFoundException;
import com.draco.seller.repository.CustomerRepository;
import com.draco.seller.repository.SellerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomerService {
    
    private final CustomerRepository customerRepository;
    private final SellerRepository sellerRepository;
    private final SellerService sellerService;
    
    @Transactional
    public CustomerResponse createCustomer(String sellerId, CustomerRequest request) {
        log.info("Creating customer for seller ID: {}", sellerId);
        
        // Verify seller exists
        if (!sellerRepository.existsById(sellerId)) {
            throw new ResourceNotFoundException("Seller not found with ID: " + sellerId);
        }
        
        // Check if customer already exists
        if (customerRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Customer with email " + request.getEmail() + " already exists");
        }
        
        Customer customer = Customer.builder()
                .name(request.getName())
                .email(request.getEmail())
                .phoneNumber(request.getPhoneNumber())
                .address(request.getAddress())
                .sellerId(sellerId)
                .status(Customer.CustomerStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        
        Customer savedCustomer = customerRepository.save(customer);
        
        // Update seller's customer list
        sellerService.addCustomerToSeller(sellerId, savedCustomer.getId());
        
        log.info("Successfully created customer with ID: {}", savedCustomer.getId());
        return mapToCustomerResponse(savedCustomer);
    }
    
    public CustomerResponse getCustomerById(String customerId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with ID: " + customerId));
        return mapToCustomerResponse(customer);
    }
    
    public List<CustomerResponse> getCustomersBySellerId(String sellerId) {
        // Verify seller exists
        if (!sellerRepository.existsById(sellerId)) {
            throw new ResourceNotFoundException("Seller not found with ID: " + sellerId);
        }
        
        return customerRepository.findBySellerId(sellerId).stream()
                .map(this::mapToCustomerResponse)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public CustomerResponse updateCustomer(String customerId, CustomerRequest request) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with ID: " + customerId));
        
        // Update basic information
        customer.setName(request.getName());
        customer.setEmail(request.getEmail());
        customer.setPhoneNumber(request.getPhoneNumber());
        customer.setAddress(request.getAddress());
        
        // Update status if provided
        if (request.getStatus() != null && !request.getStatus().isEmpty()) {
            try {
                customer.setStatus(Customer.CustomerStatus.valueOf(request.getStatus()));
            } catch (IllegalArgumentException e) {
                // If invalid status provided, keep existing status
                // Or you could throw an exception here if you want strict validation
            }
        }
        
        customer.setUpdatedAt(LocalDateTime.now());
        
        Customer updatedCustomer = customerRepository.save(customer);
        return mapToCustomerResponse(updatedCustomer);
    }
    
    @Transactional
    public void deleteCustomer(String customerId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with ID: " + customerId));
        customerRepository.delete(customer);
    }
    
    private CustomerResponse mapToCustomerResponse(Customer customer) {
        return CustomerResponse.builder()
                .id(customer.getId())
                .name(customer.getName())
                .email(customer.getEmail())
                .phoneNumber(customer.getPhoneNumber())
                .sellerId(customer.getSellerId())
                .address(customer.getAddress())
                .status(customer.getStatus())
                .createdAt(customer.getCreatedAt())
                .updatedAt(customer.getUpdatedAt())
                .build();
    }
}

