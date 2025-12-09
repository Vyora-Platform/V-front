package com.draco.seller.service;

import com.draco.seller.dto.SellerRewardRequest;
import com.draco.seller.dto.SellerRewardResponse;
import com.draco.seller.dto.SellerTotalEarnedResponse;
import com.draco.seller.entity.Seller;
import com.draco.seller.entity.SellerReward;
import com.draco.seller.exception.ResourceNotFoundException;
import com.draco.seller.repository.SellerRepository;
import com.draco.seller.repository.SellerRewardRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SellerRewardService {

    private final SellerRewardRepository sellerRewardRepository;
    private final SellerRepository sellerRepository;

    @Transactional
    public SellerRewardResponse createReward(SellerRewardRequest request) {
        log.info("Creating reward for seller unique code: {}", request.getSellerUniqueCode());

        // Step 1: Fetch seller by unique code and check if exists
        Seller seller = sellerRepository.findByReferralCode(request.getSellerUniqueCode())
                .orElseThrow(() -> {
                    log.error("Seller not found with unique code: {}", request.getSellerUniqueCode());
                    return new ResourceNotFoundException("Seller not found with unique code: " + request.getSellerUniqueCode());
                });

        log.info("Seller found: {} (ID: {})", seller.getName(), seller.getId());

        // Step 2: Create entry in seller rewards
        SellerReward reward = SellerReward.builder()
                .sellerId(seller.getId())
                .referrerId(request.getReferrerId())
                .referrerType(request.getReferrerType())
                .referralPoint(request.getReferralPoint())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        SellerReward savedReward = sellerRewardRepository.save(reward);
        log.info("Reward created successfully: {} points for seller: {}", savedReward.getReferralPoint(), seller.getId());

        return mapToResponse(savedReward, seller);
    }

    public SellerTotalEarnedResponse getSellerTotalEarned(String sellerUniqueCode, Integer page, Integer size) {
        log.info("Fetching total earned points for seller unique code: {}", sellerUniqueCode);

        // Fetch seller by unique code
        Seller seller = sellerRepository.findByReferralCode(sellerUniqueCode)
                .orElseThrow(() -> {
                    log.error("Seller not found with unique code: {}", sellerUniqueCode);
                    return new ResourceNotFoundException("Seller not found with unique code: " + sellerUniqueCode);
                });

        // Calculate total points
        List<SellerReward> allRewards = sellerRewardRepository.findBySellerId(seller.getId());
        Integer totalPoints = allRewards.stream()
                .mapToInt(SellerReward::getReferralPoint)
                .sum();

        SellerTotalEarnedResponse.SellerTotalEarnedResponseBuilder responseBuilder = SellerTotalEarnedResponse.builder()
                .sellerId(seller.getId())
                .sellerName(seller.getName())
                .sellerEmail(seller.getEmail())
                .sellerUniqueCode(seller.getReferralCode())
                .totalEarnedPoints(totalPoints)
                .totalRewards((long) allRewards.size());

        // If pagination is requested
        if (page != null && size != null && page >= 0 && size > 0) {
            Pageable pageable = PageRequest.of(page, size);
            Page<SellerReward> rewardPage = sellerRewardRepository.findBySellerId(seller.getId(), pageable);
            
            List<SellerRewardResponse> rewardResponses = rewardPage.getContent().stream()
                    .map(reward -> mapToResponse(reward, seller))
                    .collect(Collectors.toList());

            responseBuilder
                    .rewards(rewardResponses)
                    .page(page)
                    .size(size)
                    .totalPages((long) rewardPage.getTotalPages())
                    .totalElements(rewardPage.getTotalElements());
        }

        log.info("Total earned points for seller {}: {}", sellerUniqueCode, totalPoints);
        return responseBuilder.build();
    }

    private SellerRewardResponse mapToResponse(SellerReward reward, Seller seller) {
        return SellerRewardResponse.builder()
                .id(reward.getId())
                .sellerId(reward.getSellerId())
                .sellerName(seller.getName())
                .sellerEmail(seller.getEmail())
                .sellerUniqueCode(seller.getReferralCode())
                .referrerId(reward.getReferrerId())
                .referrerType(reward.getReferrerType())
                .referralPoint(reward.getReferralPoint())
                .createdAt(reward.getCreatedAt())
                .updatedAt(reward.getUpdatedAt())
                .build();
    }
}

