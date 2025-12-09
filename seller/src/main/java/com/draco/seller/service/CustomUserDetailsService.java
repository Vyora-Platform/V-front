package com.draco.seller.service;

import com.draco.seller.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.draco.seller.entity.User;
@Service
@RequiredArgsConstructor
@Slf4j
public class CustomUserDetailsService implements UserDetailsService {
    
    private final UserRepository userRepository;
    
    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        log.debug("Loading user details for email: {}", email);
        try {
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

            log.debug("Found user: {} with role: {}", email, user.getRole());

            // Ensure modulePermissions is initialized
            if (user.getModulePermissions() == null) {
                user.setModulePermissions(new java.util.ArrayList<>());
                log.debug("Initialized empty module permissions for user: {}", email);
            } else {
                log.debug("User {} has {} module permissions", email, user.getModulePermissions().size());
            }

            log.debug("Successfully loaded user details for: {}", email);
            return user;
        } catch (UsernameNotFoundException e) {
            log.warn("User not found: {}", email);
            throw e;
        } catch (Exception e) {
            log.error("Error loading user details for: {}", email, e);
            throw new UsernameNotFoundException("Error loading user with email: " + email, e);
        }
    }
}

