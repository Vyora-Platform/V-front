# Quick Start Guide

This guide will help you get the Seller Management System up and running in minutes.

## Prerequisites Check

1. **Java 17+**: Verify installation
   ```bash
   java -version
   ```

2. **MongoDB**: Ensure MongoDB is running
   ```bash
   # Check if MongoDB is running
   mongosh --eval "db.version()"
   ```

## Start the Application

### Option 1: Using Maven Wrapper (Recommended)

```bash
# Navigate to project directory
cd /Users/aman/Downloads/seller

# Run the application
./mvnw spring-boot:run
```

### Option 2: Using IDE

1. Open the project in IntelliJ IDEA or Eclipse
2. Run `SellerApplication.java`

## Verify Application is Running

Once started, you should see:

```
Started SellerApplication in X.XXX seconds
```

Access Swagger UI at: http://localhost:8181/swagger-ui.html

## Test the API

### 1. Register First Seller (via Swagger UI)

1. Open http://localhost:8181/swagger-ui.html
2. Expand **Seller Management** → **POST /api/v1/sellers/register**
3. Click **Try it out**
4. Use this sample data:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phoneNumber": "+1234567890",
  "businessName": "John's Electronics",
  "businessType": "Electronics",
  "address": "123 Main St, City, State"
}
```

5. Click **Execute**
6. Copy the `referralCode` from the response (e.g., "REF7A8B9C0D")

### 2. Register Second Seller with Referral Code

1. Still in **POST /api/v1/sellers/register**
2. Use this data (replace with actual referral code):

```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phoneNumber": "+1987654321",
  "usedReferralCode": "REF7A8B9C0D",
  "businessName": "Jane's Fashion",
  "businessType": "Clothing",
  "address": "456 Oak Ave, City, State"
}
```

### 3. Check Referrals

1. Expand **GET /api/v1/sellers/{sellerId}/referrals**
2. Enter John's `sellerId` from first response
3. Click **Execute**
4. You should see Jane listed in the referrals!

### 4. Add a Customer

1. Expand **Customer Management** → **POST /api/v1/customers/seller/{sellerId}**
2. Enter John's `sellerId`
3. Use this data:

```json
{
  "name": "Alice Johnson",
  "email": "alice@example.com",
  "phoneNumber": "+1122334455",
  "address": "789 Pine Rd, City, State"
}
```

### 5. View Seller's Customers

1. Expand **GET /api/v1/customers/seller/{sellerId}**
2. Enter John's `sellerId`
3. Click **Execute**
4. You should see Alice listed!

## Common Issues

### Issue: Application won't start - "Connection refused to MongoDB"

**Solution**: Start MongoDB
```bash
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongodb

# Windows
net start MongoDB
```

### Issue: Port 8181 already in use

**Solution**: Change port in `application.properties`
```properties
server.port=8182
```

### Issue: "Seller with email already exists"

**Solution**: Use a different email or check existing sellers:
- **GET /api/v1/sellers** to see all sellers

## Quick Testing with cURL

### Register a Seller
```bash
curl -X POST http://localhost:8181/api/v1/sellers/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Seller",
    "email": "test@example.com",
    "phoneNumber": "+1111111111",
    "businessName": "Test Business"
  }'
```

### Get All Sellers
```bash
curl http://localhost:8181/api/v1/sellers
```

## MongoDB Quick Commands

### View Data in MongoDB

```bash
# Connect to MongoDB
mongosh

# Switch to seller database
use seller_db

# View all sellers
db.sellers.find().pretty()

# View all customers
db.customers.find().pretty()

# Count sellers
db.sellers.countDocuments()

# Clear all data (be careful!)
db.sellers.deleteMany({})
db.customers.deleteMany({})
```

## Key Features to Test

✅ **Seller Registration** - Create seller accounts
✅ **Referral System** - Use referral codes during registration
✅ **View Referrals** - See who referred whom
✅ **Customer Management** - Add and view customers
✅ **Automatic Tracking** - Counts update automatically

## API Endpoints Overview

| Feature | Method | Endpoint |
|---------|--------|----------|
| Register Seller | POST | `/api/v1/sellers/register` |
| Get Seller | GET | `/api/v1/sellers/{id}` |
| View Referrals | GET | `/api/v1/sellers/{id}/referrals` |
| Add Customer | POST | `/api/v1/customers/seller/{sellerId}` |
| View Customers | GET | `/api/v1/customers/seller/{sellerId}` |

## Next Steps

1. ✅ Test all API endpoints in Swagger UI
2. ✅ Create multiple sellers with referral chains
3. ✅ Add customers to different sellers
4. ✅ Check the MongoDB data
5. ✅ Integrate with your frontend application

## Need Help?

- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **API Docs**: http://localhost:8080/api-docs
- **README**: See README.md for detailed documentation

Enjoy building with the Seller Management System! 🚀

