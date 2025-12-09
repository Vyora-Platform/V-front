package com.draco.seller.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "users")
public class User implements UserDetails {
    
    @Id
    private String id;
    
    @Indexed(unique = true)
    private String email;
    
    private String password;
    
    private String name;
    
    private UserRole role;

    // Module access permissions for employees
    private List<ModulePermission> modulePermissions;
    
    // Reference to seller if role is SELLER
    private String sellerId;
    
    private Boolean enabled;
    
    private Boolean accountNonExpired;
    
    private Boolean accountNonLocked;
    
    private Boolean credentialsNonExpired;
    
    private LocalDateTime lastLoginAt;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    public enum UserRole {
        ADMIN,
        EMPLOYEE,
        SELLER
    }

    public enum ModulePermission {
        DASHBOARD,
        SELLERS,
        LEADS,
        CONTENT,
        PAYOUTS,
        PROFILE
    }
    
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        List<GrantedAuthority> authorities = new ArrayList<>();
        
        if (role != null) {
            authorities.add(new SimpleGrantedAuthority("ROLE_" + role.name()));
        }

        // Add module permissions as authorities
        if (modulePermissions != null && !modulePermissions.isEmpty()) {
            for (ModulePermission permission : modulePermissions) {
                authorities.add(new SimpleGrantedAuthority("PERMISSION_" + permission.name()));
            }
        } else if (role == UserRole.EMPLOYEE) {
            // Default permissions for employees if none specified
            authorities.add(new SimpleGrantedAuthority("PERMISSION_DASHBOARD"));
        }

        return authorities;
    }
    
    @Override
    public String getUsername() {
        return email;
    }
    
    @Override
    public boolean isAccountNonExpired() {
        return accountNonExpired != null ? accountNonExpired : true;
    }
    
    @Override
    public boolean isAccountNonLocked() {
        return accountNonLocked != null ? accountNonLocked : true;
    }
    
    @Override
    public boolean isCredentialsNonExpired() {
        return credentialsNonExpired != null ? credentialsNonExpired : true;
    }
    
    @Override
    public boolean isEnabled() {
        return enabled != null ? enabled : true;
    }
}

