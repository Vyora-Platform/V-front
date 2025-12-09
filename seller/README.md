# Seller Management System

A comprehensive Spring Boot application with a beautiful modern UI for managing sellers, customers, and referral tracking system.

## 🎨 NEW: Beautiful Web UI Included!

Access the modern, responsive web interface at: **http://localhost:8080**

Features:
- 📊 Interactive Dashboard with real-time statistics
- 👥 Seller Management with registration and referral tracking
- 👨‍👩‍👦 Customer Management with easy addition and viewing
- 🔗 Referral Network Visualization
- 📱 Fully Responsive Design (Desktop, Tablet, Mobile)
- ✨ Modern UI with smooth animations and gradients

## Features

### Component 1: Seller Onboarding & Account Management

- **Seller Registration**: Create seller accounts with complete business information
- **Unique Referral Codes**: Each seller automatically gets a unique referral code upon registration
- **Referral System**: Sellers can register using another seller's referral code
- **Account Status**: Track seller account status (PENDING, ACTIVE, SUSPENDED, INACTIVE)
- **Business Details**: Store business name, type, address, and contact information

### Referral Tracking

- **View Referrals**: Sellers can see all sellers they have referred
- **Referral Statistics**: Track total number of referrals
- **Referral Chain**: See who referred them and their complete referral network

### Customer Management

- **Add Customers**: Sellers can add customers to their account
- **View Customers**: Sellers can see all their customers
- **Customer Details**: Manage customer information (name, email, phone, address)
- **Customer Tracking**: Automatically track total number of customers per seller

### API Documentation

- **Swagger UI**: Interactive API documentation with Swagger/OpenAPI 3.0
- **API Testing**: Test all endpoints directly from the browser
- **Comprehensive Documentation**: Detailed descriptions for all endpoints

## Technology Stack

- **Framework**: Spring Boot 3.5.5
- **Language**: Java 17
- **Database**: MongoDB
- **Documentation**: SpringDoc OpenAPI (Swagger)
- **Build Tool**: Maven
- **Additional Libraries**:
  - Lombok (reduce boilerplate code)
  - Apache Commons Lang3 (utilities)
  - Spring Data MongoDB
  - Spring Validation

## Prerequisites

- Java 17 or higher
- Maven 3.6+
- MongoDB 4.4+ (running locally or remotely)

## Setup Instructions

### 1. Install MongoDB

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Linux:**
```bash
sudo apt-get install mongodb
sudo systemctl start mongodb
```

**Windows:**
Download and install from [MongoDB Official Site](https://www.mongodb.com/try/download/community)

### 2. Configure Application

The application is pre-configured to connect to MongoDB on `localhost:27017` with database name `seller_db`.

To modify MongoDB connection settings, edit `src/main/resources/application.properties`:

```properties
spring.data.mongodb.host=localhost
spring.data.mongodb.port=27017
spring.data.mongodb.database=seller_db
```

### 3. Build and Run

```bash
# Build the project
./mvnw clean install

# Run the application
./mvnw spring-boot:run
```

The application will start on `http://localhost:8181`

## 🎨 Access the Application

### Web UI (Recommended for Users)
```
http://localhost:8181
```

Beautiful, modern interface with:
- Dashboard with statistics
- Seller registration and management
- Customer management
- Referral tracking and visualization

### API Documentation (For Developers)

Once the application is running, access the Swagger UI at:

```
http://localhost:8181/swagger-ui.html
```

API JSON documentation available at:

```
http://localhost:8181/api-docs
```

## API Endpoints

### Seller Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/sellers/register` | Register a new seller |
| GET | `/api/v1/sellers/{sellerId}` | Get seller by ID |
| GET | `/api/v1/sellers/email/{email}` | Get seller by email |
| GET | `/api/v1/sellers` | Get all sellers |
| GET | `/api/v1/sellers/{sellerId}/referrals` | Get seller's referral information |

### Customer Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/customers/seller/{sellerId}` | Create a new customer for a seller |
| GET | `/api/v1/customers/{customerId}` | Get customer by ID |
| GET | `/api/v1/customers/seller/{sellerId}` | Get all customers for a seller |
| PUT | `/api/v1/customers/{customerId}` | Update customer information |
| DELETE | `/api/v1/customers/{customerId}` | Delete a customer |

## Usage Examples

### 1. Register a New Seller (Without Referral)

```bash
curl -X POST http://localhost:8181/api/v1/sellers/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phoneNumber": "+1234567890",
    "businessName": "John'\''s Electronics",
    "businessType": "Electronics",
    "address": "123 Main St, City, State"
  }'
```

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john@example.com",
  "phoneNumber": "+1234567890",
  "referralCode": "REF7A8B9C0D",
  "businessName": "John's Electronics",
  "businessType": "Electronics",
  "status": "ACTIVE",
  "totalCustomers": 0,
  "totalReferrals": 0,
  "createdAt": "2025-11-09T10:30:00"
}
```

### 2. Register a Seller with Referral Code

```bash
curl -X POST http://localhost:8181/api/v1/sellers/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "email": "jane@example.com",
    "phoneNumber": "+1987654321",
    "usedReferralCode": "REF7A8B9C0D",
    "businessName": "Jane'\''s Fashion",
    "businessType": "Clothing"
  }'
```

### 3. Get Seller's Referral Information

```bash
curl http://localhost:8181/api/v1/sellers/{sellerId}/referrals
```

**Response:**
```json
{
  "myReferralCode": "REF7A8B9C0D",
  "usedReferralCode": null,
  "referredBy": null,
  "totalReferrals": 1,
  "referredSellers": [
    {
      "id": "507f1f77bcf86cd799439012",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "referralCode": "REFX1Y2Z3W4"
    }
  ]
}
```

### 4. Add a Customer to a Seller

```bash
curl -X POST http://localhost:8181/api/v1/customers/seller/{sellerId} \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Johnson",
    "email": "alice@example.com",
    "phoneNumber": "+1122334455",
    "address": "456 Oak Ave, City, State"
  }'
```

### 5. Get All Customers for a Seller

```bash
curl http://localhost:8181/api/v1/customers/seller/{sellerId}
```

## Data Models

### Seller

```json
{
  "id": "string",
  "name": "string",
  "email": "string",
  "phoneNumber": "string",
  "referralCode": "string",
  "usedReferralCode": "string",
  "referredBy": "string",
  "businessName": "string",
  "businessType": "string",
  "address": "string",
  "status": "ACTIVE",
  "totalCustomers": 0,
  "totalReferrals": 0,
  "customerIds": [],
  "referredSellerIds": [],
  "createdAt": "2025-11-09T10:30:00",
  "updatedAt": "2025-11-09T10:30:00"
}
```

### Customer

```json
{
  "id": "string",
  "name": "string",
  "email": "string",
  "phoneNumber": "string",
  "sellerId": "string",
  "address": "string",
  "status": "ACTIVE",
  "createdAt": "2025-11-09T10:30:00",
  "updatedAt": "2025-11-09T10:30:00"
}
```

## Database Schema

The application uses MongoDB with the following collections:

- **sellers**: Stores seller information
  - Indexes: email (unique), referralCode (unique)
  
- **customers**: Stores customer information
  - Indexes: email (unique), sellerId

## Error Handling

The API uses standard HTTP status codes:

- `200 OK`: Successful GET request
- `201 Created`: Successful POST request
- `204 No Content`: Successful DELETE request
- `400 Bad Request`: Invalid input data
- `404 Not Found`: Resource not found
- `409 Conflict`: Duplicate resource
- `500 Internal Server Error`: Server error

Error responses follow this format:

```json
{
  "status": 404,
  "message": "Seller not found with ID: xyz",
  "timestamp": "2025-11-09T10:30:00"
}
```

## Development

### Running Tests

```bash
./mvnw test
```

### Building JAR

```bash
./mvnw clean package
java -jar target/seller-0.0.1-SNAPSHOT.jar
```

## Project Structure

```
seller/
├── src/
│   ├── main/
│   │   ├── java/com/draco/seller/
│   │   │   ├── config/          # Configuration classes
│   │   │   ├── controller/      # REST controllers
│   │   │   ├── dto/             # Data Transfer Objects
│   │   │   ├── entity/          # MongoDB entities
│   │   │   ├── exception/       # Exception handling
│   │   │   ├── repository/      # Data access layer
│   │   │   ├── service/         # Business logic
│   │   │   └── SellerApplication.java
│   │   └── resources/
│   │       └── application.properties
│   └── test/
├── pom.xml
└── README.md
```

## 🎉 NEW FEATURES (Version 2.0)

### ✅ Implemented Features

- ✅ **JWT Authentication** - Secure login system with token-based authentication
- ✅ **Leads Management** - Track and manage sales leads with status tracking
- ✅ **Marketing Content Library** - Access marketing materials (text, images, videos, PDFs)
- ✅ **Social Media Integration** - Track shares and downloads of marketing content
- ✅ **Role-Based Access Control** - Admin and Seller roles with different permissions
- ✅ **Lead Pipeline Tracking** - Track leads from NEW to WON status
- ✅ **Content Analytics** - View count, download count, and share tracking

### New API Endpoints

#### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login and get JWT token

#### Leads Management
- `POST /api/v1/leads` - Create new lead
- `GET /api/v1/leads` - Get all leads for seller
- `GET /api/v1/leads/{id}` - Get specific lead
- `PUT /api/v1/leads/{id}` - Update lead
- `DELETE /api/v1/leads/{id}` - Delete lead

#### Marketing Content
- `GET /api/v1/marketing-content` - Get all marketing content
- `GET /api/v1/marketing-content/category/{category}` - Filter by category
- `GET /api/v1/marketing-content/type/{type}` - Filter by type
- `POST /api/v1/marketing-content/{id}/download` - Track download
- `POST /api/v1/marketing-content/{id}/share` - Track social media share

See **NEW_FEATURES_SUMMARY.md** for complete details and usage examples.

## Future Enhancements

- Implement seller dashboard with analytics and charts
- Add email notifications for leads and referrals
- Implement reward system for successful referrals
- Add advanced search and filtering with pagination
- Add customer order history
- Implement real-time notifications using WebSocket
- Admin panel for uploading marketing content
- Lead conversion funnel visualization

## 📚 Additional Documentation

- **UI_README.md** - Complete UI documentation and features
- **UI_QUICKSTART.md** - 2-minute UI quick start guide
- **API_EXAMPLES.md** - Comprehensive API examples
- **ARCHITECTURE.md** - System architecture and design
- **QUICKSTART.md** - Backend quick start guide
- **PROJECT_SUMMARY.md** - Project overview and summary

## Support

For issues or questions, please contact: support@draco.com

## License

This project is licensed under the Apache License 2.0

