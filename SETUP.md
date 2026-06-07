# 🏠 EnergyIQ — Smart Home Energy Monitor

Complete setup guide for the real authentication system.

## 📋 What Was Fixed

✅ **Real Database Authentication**
- Removed plain-text password storage
- Added bcrypt password hashing
- Implemented JWT token-based sessions

✅ **Backend Infrastructure**
- Node.js/Express REST API
- MySQL database with proper schema
- Authentication endpoints (signup, login, verify)
- Device management endpoints

✅ **Frontend Updates**
- Connected to real backend API
- JWT token management
- Secure session handling
- Error handling & validation

✅ **Code Quality**
- Removed duplicate signup forms
- Removed mixed auth logic
- Centralized API communication
- Proper error messages

## 🚀 Quick Start

### Backend Setup (5 minutes)

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Initialize Database**
   ```bash
   mysql -u root -p < database.sql
   ```
   When prompted, use password: `Ateeka1225@`

3. **Start Server**
   ```bash
   node server.js
   ```
   
   Expected: `✅ Server running on http://localhost:3000`

### Frontend Setup

1. **Serve the frontend** (use any web server):
   ```bash
   # Option 1: Using VS Code Live Server
   # Right-click index.html → Open with Live Server
   
   # Option 2: Using Python
   python -m http.server 5500
   
   # Option 3: Using Node.js
   npx http-server -p 5500
   ```

2. **Open in browser**
   ```
   http://127.0.0.1:5500/wwwroot/index.html
   ```

## 📝 Default Test Account

Since you started fresh, create a new account:
- Visit signup page
- Create account with any username/password
- Log in

OR modify `backend/server.js` to seed a demo account:
```javascript
// Add after pool creation:
pool.getConnection().then(conn => {
  conn.query("INSERT INTO users (username, email, full_name, password_hash) VALUES (?, ?, ?, ?)",
    ["admin", "admin@test.com", "Admin User", "$2a$10$...hash..."]
  ).catch(() => {}); // Ignore if exists
  conn.release();
});
```

## 🔧 File Structure

```
Smarthome App/
├── backend/
│   ├── server.js           ✅ NEW — Express API server
│   ├── database.sql        ✅ UPDATED — Real schema
│   ├── package.json        ✅ UPDATED — Added bcryptjs, jwt
│   ├── SETUP.md            ✅ NEW — Backend docs
│   └── Controllers/        (Legacy, not used)
│
├── wwwroot/
│   ├── index.html          ✅ Frontend
│   ├── script.js           ✅ UPDATED — Real API calls
│   ├── style.css           (UI styles)
│   └── js/
│       └── api.js          ✅ NEW — API client
│
├── Smarthome App/
│   ├── AuthService.js      (Legacy local hashing)
│   ├── StorageService.js
│   └── ...
│
└── index.html              ✅ Root entry point
```

## 🔐 Security Features Added

✅ **Password Security**
- Bcrypt hashing (salt rounds: 10)
- Never store plain-text passwords
- Passwords hashed on backend only

✅ **Session Management**
- JWT tokens (24-hour expiry)
- Secure token storage in localStorage
- Token validation on API calls

✅ **API Protection**
- Authentication middleware on all endpoints
- CORS enabled for local dev
- Error messages don't leak data

## 🐛 Troubleshooting

### Issue: "Cannot GET /api/auth/login"
**Solution:** Backend not running
```bash
cd backend
node server.js
```

### Issue: "ER_NO_DB_SELECTED"
**Solution:** Database not initialized
```bash
mysql -u root -p < database.sql
```

### Issue: "CORS policy: No 'Access-Control-Allow-Origin'"
**Solution:** Ensure backend CORS is enabled (it is by default)

### Issue: "Invalid token"
**Solution:** Token expired, user needs to log in again

### Issue: Frontend loads but can't log in
**Solution:** Check browser console (F12) for error messages, verify:
- Backend is running on `http://localhost:3000`
- Database has schema initialized
- No typos in username/password

## 📚 API Reference

See [backend/SETUP.md](backend/SETUP.md) for complete API docs.

### Quick Examples

**Signup:**
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john",
    "email": "john@test.com",
    "password": "pass123",
    "fullName": "John Doe"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "john", "password": "pass123"}'
```

**Add Device (with token):**
```bash
curl -X POST http://localhost:3000/api/devices \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Living Room AC",
    "category": "Cooling",
    "location": "Living Room",
    "brand": "LG",
    "wattage": 1500
  }'
```

## 🚨 Important Notes

⚠️ **Database Credentials**
- Default MySQL user: `root`
- Default password: `Ateeka1225@`
- Change these in production!

⚠️ **CORS Configuration**
- Currently allows `localhost:3000`, `localhost:5500`, `127.0.0.1:5500`
- Update `server.js` line 9 for production

⚠️ **JWT Secret**
- Default: `'your_jwt_secret_key_change_in_production'`
- Set proper secret via environment variable in production

## 📈 Next Steps

1. ✅ Test signup/login workflow
2. 🔄 Add device and verify database saves
3. 🔐 Implement email verification
4. 🔔 Add email notifications
5. 📊 Build analytics endpoints
6. 🌐 Deploy to production

## 💡 Development Tips

- Use Chrome DevTools (F12) to inspect API calls
- Check Network tab to see request/response
- Use `console.log()` to debug
- Backend logs show errors with full stack trace

## 📞 Support

For errors, check:
1. Browser console (F12 → Console)
2. Backend terminal output
3. MySQL error logs
4. `backend/SETUP.md` for troubleshooting

---

**Last Updated:** June 2026
**Version:** 2.0 — Real Authentication
