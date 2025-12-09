package com.draco.seller.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {
    
    @Value("${server.port:8181}")
    private String serverPort;
    
    @Bean
    public OpenAPI sellerOpenAPI() {
        // Local development server
        Server localServer = new Server();
        localServer.setUrl("http://localhost:" + serverPort);
        localServer.setDescription("Local Development Server");
        
        // Production server (AWS EC2)
        Server prodServer = new Server();
        prodServer.setUrl("http://ec2-15-206-165-3.ap-south-1.compute.amazonaws.com:" + serverPort);
        prodServer.setDescription("Production Server (AWS EC2)");
        
        Contact contact = new Contact();
        contact.setName("Draco Support");
        contact.setEmail("support@draco.com");
        
        License license = new License()
                .name("Apache 2.0")
                .url("https://www.apache.org/licenses/LICENSE-2.0.html");
        
        Info info = new Info()
                .title("Seller Management API")
                .version("2.0.0")
                .description("Comprehensive API for seller onboarding, customer management, leads tracking, marketing content, and referral system with JWT authentication")
                .contact(contact)
                .license(license)
                .termsOfService("https://draco.com/terms");
        
        return new OpenAPI()
                .info(info)
                .servers(List.of(localServer, prodServer))
                .addSecurityItem(new SecurityRequirement().addList("Bearer Authentication"))
                .components(new Components()
                        .addSecuritySchemes("Bearer Authentication", new SecurityScheme()
                                .name("Bearer Authentication")
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")));
    }
}

