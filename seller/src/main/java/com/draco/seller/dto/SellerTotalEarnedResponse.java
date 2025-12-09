package com.draco.seller.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SellerTotalEarnedResponse {
    
    private String sellerId;
    private String sellerName;
    private String sellerEmail;
    private String sellerUniqueCode;
    private Integer totalEarnedPoints;
    private Long totalRewards;
    private List<SellerRewardResponse> rewards;  // Only populated when pagination is used
    private Integer page;  // Current page (if paginated)
    private Integer size;  // Page size (if paginated)
    private Long totalPages;  // Total pages (if paginated)
    private Long totalElements;  // Total elements (if paginated)
}

