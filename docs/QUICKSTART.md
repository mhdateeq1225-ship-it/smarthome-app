# ⚡ EnergyIQ — Quick Start (5 Minutes)

## ✅ What Was Done

Your app now has **real authentication** with:
- ✅ Secure password hashing (bcrypt)
- ✅ JWT token sessions
- ✅ Real MySQL database
- ✅ Proper error handling
- ✅ No more duplicate signup pages

---

## 🚀 Get Started Now

### Step 1: Set Up Backend (2 min)
```bash
cd backend
npm install
```

### Step 2: Create Database (1 min)
```bash
mysql -u root -p < database.sql
```
Password: `Ateeka1225@`

### Step 3: Start Backend (1 min)
```bash
node server.js
```
✅ Should see: `Server running on http://localhost:3000`

### Step 4: Open Frontend (1 min)
1. Open `wwwroot/index.html` in browser
2. **or** use Live Server:
   - Right-click `wwwroot/index.html` → "Open with Live Server"

---

## 🧪 Test It

### Signup
1. Click **"Create Account"** tab
2. Fill in:
   - Name: `John Doe`
   - Email: `john@test.com`
   - Username: `johndoe`
   - Password: `test1234`
3. Click **"Create Account"**
4. ✅ Should see success message

### Login
1. Click **"Sign In"** tab (auto-filled with username)
2. Enter password: `test1234`
3. Click **"Sign In"**
4. ✅ Should be logged in to dashboard

### Add Device
1. In sidebar, click **"Add Device"**
2. Fill in device details
3. Click **"Add Device"**
4. ✅ Device appears in "My Devices"

---

## 📁 Key Files

**Backend:**
- `backend/server.js` — REST API
- `backend/database.sql` — Database schema

**Frontend:**
- `wwwroot/js/api.js` — API client
- `wwwroot/script.js` — Main app
- `wwwroot/index.html` — UI

**Documentation:**
- `SETUP.md` — Complete setup guide
- `CHANGES.md` — What was fixed
- `backend/SETUP.md` — Backend API docs

---

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Cannot connect to database" | `npm install && mysql -u root -p < database.sql` |
| "Port 3000 already in use" | Kill process: `lsof -i :3000` then `kill -9 <PID>` |
| "CORS error" | Backend should be running on port 3000 |
| "Login fails silently" | Check F12 console for error details |
| Frontend shows empty | Ensure backend is running first |

---

## 🎯 Features Ready to Use

✅ User signup/login  
✅ Secure password hashing  
✅ JWT sessions  
✅ Device management  
✅ Dashboard  
✅ Analytics  
✅ Settings  
✅ Notifications  

---

## 📝 Default Test Account

Create any account during signup. No demo account needed.

**Example:**
- Username: `testuser`
- Password: `mypassword`
- Email: `test@example.com`

---

## ⚠️ Remember

1. **Backend must run first:**
```bash
cd backend
node server.js
```

2. **Database must be initialized:**
```bash
mysql -u root -p < database.sql
```

3. **Frontend connects to `http://localhost:3000`**
   - Change in `wwwroot/js/api.js` if needed

---

## 🔐 Security Notes

✅ Passwords are hashed with **bcrypt** (10 salt rounds)  
✅ Sessions use **JWT tokens** (24-hour expiry)  
✅ All API endpoints require authentication  
✅ Database credentials should be changed in production  

---

## 📞 Next Steps

- [ ] Test signup/login
- [ ] Test device creation
- [ ] Check browser console for errors
- [ ] Review backend logs for API calls
- [ ] Ready for production? See `SETUP.md`

---

## 🎉 You're All Set!

Your EnergyIQ app now has professional authentication.

**Questions?** Check:
1. `SETUP.md` — Full setup guide
2. `backend/SETUP.md` — API documentation
3. `CHANGES.md` — All modifications made

Happy coding! ⚡

---

**Version:** 2.0 — Real Authentication  
**Last Updated:** June 2026
