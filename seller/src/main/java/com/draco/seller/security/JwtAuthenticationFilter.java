package com.draco.seller.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import lombok.extern.slf4j.Slf4j;
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    
    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        final String requestURI = request.getRequestURI();
        final String authorizationHeader = request.getHeader("Authorization");        

        // Skip authentication for public endpoints
        if (isPublicEndpoint(requestURI)) {
            log.debug("Skipping authentication for public endpoint: {}", requestURI);
            filterChain.doFilter(request, response);
            return;
        }

        log.debug("Processing authentication for endpoint: {}", requestURI);
        
        String username = null;
        String jwt = null;
        
        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            jwt = authorizationHeader.substring(7);
            try {
                username = jwtUtil.extractUsername(jwt);
            } catch (Exception e) {
                log.warn("Error extracting username from JWT token for request: {}", requestURI);
            }
        }
        
        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                log.debug("Loading user details for: {}", username);
            UserDetails userDetails = this.userDetailsService.loadUserByUsername(username);
                log.debug("User details loaded successfully for: {}", username);
            
            if (jwtUtil.validateToken(jwt, userDetails)) {
                UsernamePasswordAuthenticationToken authenticationToken =
                        new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                authenticationToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authenticationToken);
                    log.debug("Successfully authenticated user: {} for request: {}", username, requestURI);
                } else {
                    log.warn("Invalid JWT token for user: {} on request: {}", username, requestURI);
                    SecurityContextHolder.clearContext();
                }
            } catch (Exception e) {
                log.error("Error during authentication for user: {} on request: {}", username, requestURI, e);
                SecurityContextHolder.clearContext();
            }
        } else if (username == null) {
            log.debug("No JWT token found for request: {}", requestURI);
        } else {
            log.debug("User already authenticated for request: {}", requestURI);
        }
        
        filterChain.doFilter(request, response);
    }

    private boolean isPublicEndpoint(String requestURI) {
        // Allow all HTML files - frontend handles authentication
        if (requestURI.endsWith(".html")) {
            return true;
        }
        
        return requestURI.startsWith("/api/v1/auth/") ||
               requestURI.startsWith("/api/v1/sellers/register") ||
               requestURI.startsWith("/api/v1/webhook/") ||  // Allow webhook endpoints
               requestURI.startsWith("/css/") ||
               requestURI.startsWith("/js/") ||
               requestURI.startsWith("/images/") ||
               requestURI.startsWith("/uploads/") ||
               requestURI.equals("/favicon.ico") ||
               requestURI.startsWith("/swagger-ui/") ||
               requestURI.equals("/swagger-ui.html") ||
               requestURI.startsWith("/v3/api-docs/") ||
               requestURI.startsWith("/api-docs/");
    }
}

