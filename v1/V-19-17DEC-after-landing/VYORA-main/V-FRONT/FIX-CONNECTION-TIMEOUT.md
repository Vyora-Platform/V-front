# 🔧 Connection Timeout Fix

## 🚨 The Problem

Your error shows:
```
❌ [DB CONNECTION ERROR] Failed to connect to database!
   Error code: ETIMEDOUT
   → Connection timed out
   → Trying to connect to: 13.200.110.68:6543 and 3.111.225.200:6543
```

**Root Cause:** Port **6543** (Supabase Pooler) is being blocked or is unreachable from your network.

---

## ✅ Solution Applied

I've updated `start-local.sh` to use **direct database connection** instead of pooler:

**Changed from:**
```bash
# ❌ Pooler (port 6543) - TIMING OUT
postgresql://...@aws-1-ap-south-1.pooler.supabase.com:6543/postgres
```

**Changed to:**
```bash
# ✅ Direct connection (port 5432) - Should work
postgresql://...@db.abizuwqnqkbicrhorcig.supabase.co:5432/postgres
```

---

## 🧪 Test Now

Restart your server to test the new connection:

```bash
# Stop current server (Ctrl+C if running)
# Then restart:
./start-local.sh
```

You should see:
```
✅ [DB] Database connection successful!
   Current time: 2025-01-11 12:15:30
   Database name: postgres
```

---

## 🔄 Alternative Solutions (If Direct Connection Still Fails)

### Option 1: Try Session Pooler (Port 6543 with Session Mode)

```bash
export NEW_DATABASE_URL='postgresql://postgres.abizuwqnqkbicrhorcig:8819%401464%23piyaA@aws-0-ap-south-1.pooler.supabase.com:6543/postgres'
```

### Option 2: Try Transaction Pooler (Different Region)

```bash
export NEW_DATABASE_URL='postgresql://postgres.abizuwqnqkbicrhorcig:8819%401464%23piyaA@aws-0-ap-south-1.pooler.supabase.com:6543/postgres'
```

### Option 3: Check Supabase Dashboard for Correct Connection String

1. Go to: https://supabase.com/dashboard/project/abizuwqnqkbicrhorcig/settings/database
2. Look for **Connection String** section
3. Choose **Direct connection** (not Pooler)
4. Copy the connection string
5. Update `start-local.sh` with the new URL

---

## 🔍 Why Port 6543 Was Timing Out

**Common Causes:**

1. **Corporate Firewall** - Many companies block non-standard ports
2. **ISP Restrictions** - Some ISPs block certain ports
3. **VPN Required** - Your network might require VPN
4. **Supabase Region Issue** - The `ap-south-1` region might have network issues from your location

**Port Differences:**
- **Port 5432** = Direct PostgreSQL connection (more compatible)
- **Port 6543** = PgBouncer pooler (can be blocked by firewalls)

---

## 🛠️ Network Troubleshooting

### Check if Port 5432 is Accessible

```bash
# Test if you can reach Supabase on port 5432
nc -zv db.abizuwqnqkbicrhorcig.supabase.co 5432

# Or use telnet
telnet db.abizuwqnqkbicrhorcig.supabase.co 5432
```

**Expected output if accessible:**
```
Connection to db.abizuwqnqkbicrhorcig.supabase.co port 5432 [tcp/postgresql] succeeded!
```

### Check if Port 6543 is Accessible

```bash
nc -zv aws-1-ap-south-1.pooler.supabase.com 6543
```

**If this times out:** Your network is blocking port 6543 → Use port 5432 instead

---

## 📊 Connection String Formats

### ✅ Direct Connection (Recommended for Development)
```bash
postgresql://postgres.{project}:{password}@db.{project}.supabase.co:5432/postgres
```

**Pros:**
- More compatible with firewalls
- Standard PostgreSQL port (5432)
- Better for local development

**Cons:**
- Limited connections (max 60-100)
- Can hit connection limits with many concurrent users

### ⚡ Pooler Connection (Good for Production)
```bash
postgresql://postgres.{project}:{password}@aws-0-{region}.pooler.supabase.com:6543/postgres
```

**Pros:**
- Supports many more connections
- Better for production
- Connection pooling via PgBouncer

**Cons:**
- Port 6543 might be blocked
- Some features limited in transaction mode

---

## 🎯 Quick Fix Checklist

- [x] Changed connection from pooler (6543) to direct (5432)
- [x] Changed hostname from `pooler.supabase.com` to `db.{project}.supabase.co`
- [ ] Restart server: `./start-local.sh`
- [ ] Check console for `✅ [DB] Database connection successful!`
- [ ] If still failing, try alternatives above
- [ ] Check Supabase dashboard for project status

---

## 🆘 Still Not Working?

### 1. Check Supabase Project Status
- Visit: https://supabase.com/dashboard/project/abizuwqnqkbicrhorcig
- Ensure project is **active** (not paused)
- Check if there are any service disruptions

### 2. Verify Password Encoding
Your password `8819@1464#piyaA` is encoded as `8819%401464%23piyaA`
- `@` → `%40` ✅
- `#` → `%23` ✅
- This is correct!

### 3. Try Different Network
- **Mobile Hotspot** - Try connecting via your phone
- **Different WiFi** - Try from home/cafe/office
- **VPN** - Try with/without VPN

### 4. Check Firewall/Antivirus
- Temporarily disable firewall
- Check if antivirus is blocking connections
- Allow Node.js in firewall settings

---

## 📝 What Changed

**File: `start-local.sh` (Line 17)**

```bash
# Before (TIMING OUT):
export NEW_DATABASE_URL='postgresql://postgres.abizuwqnqkbicrhorcig:8819%401464%23piyaA@aws-1-ap-south-1.pooler.supabase.com:6543/postgres'

# After (SHOULD WORK):
export NEW_DATABASE_URL='postgresql://postgres.abizuwqnqkbicrhorcig:8819%401464%23piyaA@db.abizuwqnqkbicrhorcig.supabase.co:5432/postgres'
```

---

## 🚀 Next Steps

1. **Restart server** with the new connection string
2. **Check console** for success message
3. **Test the app** - try logging in, accessing dashboard
4. **Report back** if you still see timeout errors

---

**💡 Tip:** Port 5432 (direct) is more reliable for development, even though it has fewer max connections!

