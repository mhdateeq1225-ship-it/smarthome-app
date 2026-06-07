# EnergyIQ Backend — Setup Guide

## Prerequisites
- Node.js (v14+)
- MySQL Server (v5.7+)
- npm or yarn

## Installation Steps

### 1. Install Backend Dependencies
```bash
cd backend
npm install
```

This will install:
- `express` — Web framework
- `mysql2/promise` — MySQL connector
- `bcryptjs` — Password hashing
- `jsonwebtoken` — JWT token management
- `cors` — Cross-origin requests

### 2. Set Up MySQL Database

Run the database schema:
```bash
mysql -u root -p < database.sql
```

When prompted, enter your MySQL password: `Ateeka1225@`

Or manually execute [database.sql](database.sql) in your MySQL client:
```sql
CREATE DATABASE IF NOT EXISTS smarthome;
USE smarthome;
-- ... run the schema file
```

### 3. Update Server Configuration

Edit `server.js` and update the MySQL credentials if needed (lines 18-22):
```javascript
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'Ateeka1225@',  // ⚠️ Change this!
  database: 'smarthome',
  ...
});
```

### 4. Start the Backend Server
```bash
node server.js
```

Expected output:
```
✅ Server running on http://localhost:3000
📊 Database: smarthome
```

## API Endpoints

### Authentication

#### **Sign Up** — `POST /api/auth/signup`
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securePassword",
  "fullName": "John Doe"
}
```

Response:
```json
{
  "success": true,
  "message": "Account created successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "fullName": "John Doe"
  }
}
```

#### **Login** — `POST /api/auth/login`
```json
{
  "username": "johndoe",
  "password": "securePassword"
}
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { ... }
}
```

#### **Verify Token** — `GET /api/auth/verify`
Headers:
```
Authorization: Bearer {token}
```

#### **Logout** — `POST /api/auth/logout`

### Devices

#### **Get Devices** — `GET /api/devices`
Headers:
```
Authorization: Bearer {token}
```

#### **Add Device** — `POST /api/devices`
Headers:
```
Authorization: Bearer {token}
```

Body:
```json
{
  "name": "Living Room AC",
  "category": "Cooling",
  "location": "Living Room",
  "brand": "LG",
  "wattage": 1500
}
```

#### **Delete Device** — `DELETE /api/devices/:id`
Headers:
```
Authorization: Bearer {token}
```

## Frontend Configuration

The frontend expects the backend at `http://localhost:3000`.

To change this, edit `wwwroot/js/api.js`:
```javascript
const API = {
  BASE_URL: 'http://localhost:3000/api',  // ← Change here
  ...
};
```

## Security Notes

⚠️ **Production Checklist:**
- [ ] Change MySQL password in `server.js`
- [ ] Set `JWT_SECRET` environment variable
- [ ] Enable HTTPS/SSL
- [ ] Add rate limiting for login attempts
- [ ] Implement proper CORS configuration
- [ ] Never commit passwords to version control
- [ ] Use environment variables (`.env` file)
- [ ] Add password validation rules
- [ ] Enable MySQL user authentication

### Environment Variables
```bash
JWT_SECRET=your-super-secret-key-here
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your-password
MYSQL_DATABASE=smarthome
NODE_ENV=production
```

## Troubleshooting

### "MySQL Connection Error"
- Verify MySQL is running: `mysql -u root -p`
- Check credentials in `server.js`
- Ensure database `smarthome` exists

### "Cannot POST /api/auth/login"
- Verify server is running on port 3000
- Check CORS headers are correct
- Ensure request body is valid JSON

### "Invalid or expired token"
- Token may have expired (default: 24 hours)
- User must log in again
- Check `JWT_SECRET` matches on backend

### Frontend Can't Connect to Backend
- Ensure backend is running: `node server.js`
- Check CORS is enabled in `server.js`
- Verify `BASE_URL` in `api.js` matches server address
- Check browser console for error messages

## Next Steps

1. ✅ Database initialized with schema
2. ✅ Authentication endpoints ready
3. ✅ Password hashing with bcrypt
4. ✅ JWT token management
5. 🔄 Frontend connected via API
6. 📝 Add energy logging endpoints
7. 🔐 Add email verification
8. 📊 Add analytics endpoints

## References

- [Express.js Docs](https://expressjs.com/)
- [MySQL2 Docs](https://github.com/sidorares/node-mysql2)
- [bcryptjs Docs](https://www.npmjs.com/package/bcryptjs)
- [JWT Docs](https://www.npmjs.com/package/jsonwebtoken)
