package com.draco.seller.service;

import com.draco.seller.dto.EmployeeRequest;
import com.draco.seller.dto.EmployeeResponse;
import com.draco.seller.entity.User;
import com.draco.seller.exception.DuplicateResourceException;
import com.draco.seller.exception.ResourceNotFoundException;
import com.draco.seller.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmployeeService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public EmployeeResponse createEmployee(EmployeeRequest request) {
        log.info("Creating new employee: {}", request.getEmail());

        // Check if employee already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Employee with email " + request.getEmail() + " already exists");
        }

        // Create employee
        User employee = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .name(request.getName())
                .role(User.UserRole.EMPLOYEE)
                .modulePermissions(request.getModulePermissions() != null ? request.getModulePermissions() : new ArrayList<>())
                .enabled(true)
                .accountNonExpired(true)
                .accountNonLocked(true)
                .credentialsNonExpired(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        User savedEmployee = userRepository.save(employee);
        log.info("Employee created successfully: {}", savedEmployee.getId());

        return mapToResponse(savedEmployee);
    }

    public List<EmployeeResponse> getAllEmployees() {
        return userRepository.findByRole(User.UserRole.EMPLOYEE)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public EmployeeResponse getEmployeeById(String employeeId) {
        User employee = userRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        if (employee.getRole() != User.UserRole.EMPLOYEE) {
            throw new ResourceNotFoundException("User is not an employee");
        }

        return mapToResponse(employee);
    }

    @Transactional
    public EmployeeResponse updateEmployee(String employeeId, EmployeeRequest request) {
        User employee = userRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        if (employee.getRole() != User.UserRole.EMPLOYEE) {
            throw new ResourceNotFoundException("User is not an employee");
        }

        // Check if email is being changed and if it's already taken
        if (!employee.getEmail().equals(request.getEmail()) &&
            userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email " + request.getEmail() + " is already taken");
        }

        employee.setName(request.getName());
        employee.setEmail(request.getEmail());
        employee.setModulePermissions(request.getModulePermissions() != null ? request.getModulePermissions() : new ArrayList<>());
        employee.setUpdatedAt(LocalDateTime.now());

        // Update password if provided
        if (request.getPassword() != null && !request.getPassword().trim().isEmpty()) {
            employee.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        User savedEmployee = userRepository.save(employee);
        return mapToResponse(savedEmployee);
    }

    @Transactional
    public void deleteEmployee(String employeeId) {
        User employee = userRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        if (employee.getRole() != User.UserRole.EMPLOYEE) {
            throw new ResourceNotFoundException("User is not an employee");
        }

        userRepository.delete(employee);
    }

    @Transactional
    public EmployeeResponse toggleEmployeeStatus(String employeeId) {
        User employee = userRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        if (employee.getRole() != User.UserRole.EMPLOYEE) {
            throw new ResourceNotFoundException("User is not an employee");
        }

        employee.setEnabled(!employee.getEnabled());
        employee.setUpdatedAt(LocalDateTime.now());

        User savedEmployee = userRepository.save(employee);
        return mapToResponse(savedEmployee);
    }

    private EmployeeResponse mapToResponse(User user) {
        return EmployeeResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .modulePermissions(user.getModulePermissions())
                .enabled(user.getEnabled())
                .lastLoginAt(user.getLastLoginAt())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
