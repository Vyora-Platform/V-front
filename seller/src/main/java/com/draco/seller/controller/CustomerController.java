package com.draco.seller.controller;

import com.draco.seller.dto.CustomerRequest;
import com.draco.seller.dto.CustomerResponse;
import com.draco.seller.service.CustomerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/customers")
@RequiredArgsConstructor
@Tag(name = "Customer Management", description = "APIs for managing customers associated with sellers")
public class CustomerController {
    
    private final CustomerService customerService;
    
    @PostMapping("/seller/{sellerId}")
    @Operation(
        summary = "Create a new customer",
        description = "Add a new customer for a specific seller"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "201",
            description = "Customer created successfully",
            content = @Content(schema = @Schema(implementation = CustomerResponse.class))
        ),
        @ApiResponse(
            responseCode = "400",
            description = "Invalid input data"
        ),
        @ApiResponse(
            responseCode = "404",
            description = "Seller not found"
        ),
        @ApiResponse(
            responseCode = "409",
            description = "Customer with this email already exists"
        )
    })
    public ResponseEntity<CustomerResponse> createCustomer(
            @Parameter(description = "Seller ID", required = true)
            @PathVariable String sellerId,
            @Valid @RequestBody CustomerRequest request) {
        CustomerResponse response = customerService.createCustomer(sellerId, request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }
    
    @GetMapping("/{customerId}")
    @Operation(
        summary = "Get customer by ID",
        description = "Retrieve detailed information about a specific customer"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Customer found",
            content = @Content(schema = @Schema(implementation = CustomerResponse.class))
        ),
        @ApiResponse(
            responseCode = "404",
            description = "Customer not found"
        )
    })
    public ResponseEntity<CustomerResponse> getCustomerById(
            @Parameter(description = "Customer ID", required = true)
            @PathVariable String customerId) {
        CustomerResponse response = customerService.getCustomerById(customerId);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/seller/{sellerId}")
    @Operation(
        summary = "Get all customers for a seller",
        description = "Retrieve a list of all customers associated with a specific seller"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Customers retrieved successfully"
        ),
        @ApiResponse(
            responseCode = "404",
            description = "Seller not found"
        )
    })
    public ResponseEntity<List<CustomerResponse>> getCustomersBySellerId(
            @Parameter(description = "Seller ID", required = true)
            @PathVariable String sellerId) {
        List<CustomerResponse> customers = customerService.getCustomersBySellerId(sellerId);
        return ResponseEntity.ok(customers);
    }
    
    @PutMapping("/{customerId}")
    @Operation(
        summary = "Update customer information",
        description = "Update details of an existing customer"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Customer updated successfully",
            content = @Content(schema = @Schema(implementation = CustomerResponse.class))
        ),
        @ApiResponse(
            responseCode = "400",
            description = "Invalid input data"
        ),
        @ApiResponse(
            responseCode = "404",
            description = "Customer not found"
        )
    })
    public ResponseEntity<CustomerResponse> updateCustomer(
            @Parameter(description = "Customer ID", required = true)
            @PathVariable String customerId,
            @Valid @RequestBody CustomerRequest request) {
        CustomerResponse response = customerService.updateCustomer(customerId, request);
        return ResponseEntity.ok(response);
    }
    
    @DeleteMapping("/{customerId}")
    @Operation(
        summary = "Delete a customer",
        description = "Remove a customer from the system"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "204",
            description = "Customer deleted successfully"
        ),
        @ApiResponse(
            responseCode = "404",
            description = "Customer not found"
        )
    })
    public ResponseEntity<Void> deleteCustomer(
            @Parameter(description = "Customer ID", required = true)
            @PathVariable String customerId) {
        customerService.deleteCustomer(customerId);
        return ResponseEntity.noContent().build();
    }
}

