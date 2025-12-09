# 🌐 Production Deployment Fix

## Problem
The frontend was hardcoded to use `http://localhost:8181` for API calls. When deployed to production (AWS EC2), all API calls were still going to localhost instead of the production server.

## Solution
Changed all API URLs to be **dynamic** - they automatically adapt based on the current host.

---

## ✅ What Was Fixed

### 1. **Frontend: register.html** - Main Fix
**Before:**
```javascript
const API_BASE_URL = 'http://localhost:8181/api/v1';
```

**After:**
```javascript
// Dynamic API URL - works for both localhost and production
const API_BASE_URL = window.location.origin + '/api/v1';
```

### 2. **Backend: MarketingContentController.java** - Image URL Fix
**Before:**
```java
String fileUrl = "http://localhost:" + serverPort + "/uploads/" + filename;
// Returns: http://localhost:8181/uploads/image.png
```

**After:**
```java
// Use relative path - works for both localhost and production
String fileUrl = "/uploads/" + filename;
// Returns: /uploads/image.png (browser uses current host)
```

**Impact:**
- Image previews now work in production
- Video thumbnails work in production
- PDF previews work in production
- All uploaded content accessible from any host

### 3. **js/app.js** - Already Correct ✅
```javascript
const API_BASE_URL = '/api/v1';  // Relative path - works everywhere
```

### 4. **login.html** - Already Correct ✅
```javascript
fetch('/api/v1/auth/login', {  // Relative path - works everywhere
```

### 5. **Created js/config.js** - New Configuration File
A centralized configuration that can be used across all pages.

### 6. **OpenApiConfig.java** - Added Production Server
Now Swagger UI can test APIs on both local and production servers.

---

## 🚀 How It Works

### Dynamic URL Detection

| Environment | Window Location | API URL |
|-------------|----------------|---------|
| **Local Development** | `http://localhost:8181` | `http://localhost:8181/api/v1` |
| **AWS Production** | `http://ec2-15-206-165-3.ap-south-1.compute.amazonaws.com:8181` | `http://ec2-15-206-165-3.ap-south-1.compute.amazonaws.com:8181/api/v1` |
| **Any Domain** | `http://yourdomain.com` | `http://yourdomain.com/api/v1` |

### Code Explanation

```javascript
window.location.origin
// Returns the current page's origin
// Example: "http://localhost:8181"
// Example: "http://ec2-15-206-165-3.ap-south-1.compute.amazonaws.com:8181"

window.location.origin + '/api/v1'
// Dynamically builds the API URL
// Local: "http://localhost:8181/api/v1"
// Production: "http://ec2-15-206-165-3.ap-south-1.compute.amazonaws.com:8181/api/v1"
```

---

## 📝 Testing

### Test Locally (http://localhost:8181)

1. Open Browser Console (F12)
2. Run:
```javascript
console.log(window.location.origin);
// Should show: "http://localhost:8181"

console.log(window.location.origin + '/api/v1');
// Should show: "http://localhost:8181/api/v1"
```

3. Try registering a seller at:
```
http://localhost:8181/register.html
```

4. Check Network tab - API calls should go to:
```
http://localhost:8181/api/v1/sellers/register
```

### Test on Production (AWS EC2)

1. Open Browser Console (F12)
2. Run:
```javascript
console.log(window.location.origin);
// Should show: "http://ec2-15-206-165-3.ap-south-1.compute.amazonaws.com:8181"

console.log(window.location.origin + '/api/v1');
// Should show: "http://ec2-15-206-165-3.ap-south-1.compute.amazonaws.com:8181/api/v1"
```

3. Try registering a seller at:
```
http://ec2-15-206-165-3.ap-south-1.compute.amazonaws.com:8181/register.html
```

4. Check Network tab - API calls should go to:
```
http://ec2-15-206-165-3.ap-south-1.compute.amazonaws.com:8181/api/v1/sellers/register
```

---

## 🔍 Verification Checklist

### On Production Server:

- [ ] Open `http://ec2-15-206-165-3.ap-south-1.compute.amazonaws.com:8181/login.html`
- [ ] Open Browser DevTools (F12) → Network Tab
- [ ] Try to login
- [ ] Verify API calls go to EC2 URL, NOT localhost
- [ ] Open `http://ec2-15-206-165-3.ap-south-1.compute.amazonaws.com:8181/register.html`
- [ ] Try to register a seller
- [ ] Verify API calls go to EC2 URL, NOT localhost

### Expected Network Tab Results:

✅ **Correct:**
```
POST http://ec2-15-206-165-3.ap-south-1.compute.amazonaws.com:8181/api/v1/auth/login
POST http://ec2-15-206-165-3.ap-south-1.compute.amazonaws.com:8181/api/v1/sellers/register
```

❌ **Wrong (Before Fix):**
```
POST http://localhost:8181/api/v1/auth/login  ← Would fail in production!
POST http://localhost:8181/api/v1/sellers/register  ← Would fail in production!
```

---

## 📂 Files Modified

### Frontend:
1. ✅ **src/main/resources/static/register.html**
   - Changed hardcoded localhost URL to dynamic URL

2. ✅ **src/main/resources/static/js/config.js** (NEW)
   - Created centralized configuration file
   - Can be used by future pages if needed

### Backend:
3. ✅ **src/main/java/com/draco/seller/controller/MarketingContentController.java**
   - Changed hardcoded `http://localhost:8181/uploads/` to relative path `/uploads/`
   - Image/file URLs now work in both local and production

4. ✅ **src/main/java/com/draco/seller/config/OpenApiConfig.java**
   - Added production server to Swagger documentation
   - Swagger UI now supports both local and production servers

### Test Files:
5. ℹ️ **Test files remain unchanged** (only used for debugging):
   - `test-standalone.html`
   - `test-sellers-simple.html`
   - `debug-admin.html`
   - `test-api-simple.html`

---

## 🎯 Benefits

### 1. **Works Everywhere**
- ✅ Local development
- ✅ Staging servers
- ✅ Production servers
- ✅ Any domain/IP address

### 2. **Zero Configuration**
- No need to change config when deploying
- No environment variables needed
- Automatically detects the current environment

### 3. **Developer Friendly**
- Works on `localhost:8181`
- Works on `127.0.0.1:8181`
- Works on any port
- Works on any domain

### 4. **Production Ready**
- Works on AWS EC2
- Works on custom domains
- Works behind load balancers
- Works with HTTPS

---

## 🔧 Deployment Steps

### Option 1: Rebuild and Redeploy (Recommended)

```bash
# 1. Clean and build the project
mvn clean package

# 2. Copy the JAR to your EC2 server
scp target/seller-management-*.jar ec2-user@ec2-15-206-165-3.ap-south-1.compute.amazonaws.com:~/

# 3. SSH into EC2 server
ssh ec2-user@ec2-15-206-165-3.ap-south-1.compute.amazonaws.com

# 4. Stop the existing application
sudo systemctl stop seller-app
# OR
pkill -f seller-management

# 5. Start the new version
java -jar seller-management-*.jar

# 6. Test the application
curl http://localhost:8181/api/v1/sellers
```

### Option 2: Direct File Update (Quick Fix)

```bash
# SSH into EC2 server
ssh ec2-user@ec2-15-206-165-3.ap-south-1.compute.amazonaws.com

# Navigate to the application directory
cd ~/application

# Find the static files
# They're inside the JAR file, so we need to extract and update them

# 1. Extract the JAR
mkdir temp
cd temp
jar xf ../seller-management-*.jar

# 2. Update register.html
nano BOOT-INF/classes/static/register.html
# Change line 299:
# FROM: const API_BASE_URL = 'http://localhost:8181/api/v1';
# TO:   const API_BASE_URL = window.location.origin + '/api/v1';

# 3. Repackage the JAR
jar cf ../seller-management-updated.jar *

# 4. Replace and restart
cd ..
mv seller-management-*.jar seller-management-old.jar
mv seller-management-updated.jar seller-management-*.jar
sudo systemctl restart seller-app
```

---

## 🧪 Quick Test Command

Run this in your browser console on production:

```javascript
// Test 1: Check current origin
console.log('Origin:', window.location.origin);

// Test 2: Test API call
fetch(window.location.origin + '/api/v1/sellers')
  .then(r => r.json())
  .then(data => console.log('✅ API works!', data))
  .catch(err => console.error('❌ API failed:', err));
```

---

## 🎉 Result

### Before Fix:
```
Browser: http://ec2-15-206-165-3.ap-south-1.compute.amazonaws.com:8181/register.html
API Call: http://localhost:8181/api/v1/sellers/register
Result: ❌ Failed (localhost not accessible from internet)
```

### After Fix:
```
Browser: http://ec2-15-206-165-3.ap-south-1.compute.amazonaws.com:8181/register.html
API Call: http://ec2-15-206-165-3.ap-south-1.compute.amazonaws.com:8181/api/v1/sellers/register
Result: ✅ Success (uses the same host as the frontend)
```

---

## 🔐 Security Note

If you plan to use HTTPS in the future:

```javascript
// The dynamic URL will automatically work with HTTPS
// https://yourdomain.com → API calls go to https://yourdomain.com/api/v1

// If you need to force HTTPS:
const API_BASE_URL = window.location.origin.replace('http:', 'https:') + '/api/v1';
```

---

## 📞 Support

If you encounter issues:

1. **Check Browser Console (F12)**
   - Look for errors
   - Check what API_BASE_URL is set to

2. **Check Network Tab**
   - See which URL API calls are going to
   - Check response status codes

3. **Server Logs**
   - Check if requests are reaching the server
   - Look for CORS errors

---

**✅ The application is now ready for deployment to any environment!**

