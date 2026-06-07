const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();

// MIDDLEWARE
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5500', 'http://127.0.0.1:5500'],
  credentials: true
}));
app.use(express.json());

// CONFIG
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production';
const TOKEN_EXPIRY = '24h';

// MySQL connection pool
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'Ateeka1225@',
  database: 'smarthome',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Smart Home Backend Running', version: '2.0' });
});

// AUTHENTICATION MIDDLEWARE
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// ============================================
// AUTH ENDPOINTS
// ============================================

// SIGNUP
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, email, password, fullName } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (password.length < 4) {
      return res.status(400).json({ success: false, message: 'Password must be at least 4 characters' });
    }

    const conn = await pool.getConnection();

    try {
      // Check if user exists
      const [existing] = await conn.query(
        'SELECT id FROM users WHERE username = ? OR email = ?',
        [username, email]
      );

      if (existing.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Username or email already exists' 
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert user
      const [result] = await conn.query(
        'INSERT INTO users (username, email, full_name, password_hash) VALUES (?, ?, ?, ?)',
        [username, email, fullName || username, hashedPassword]
      );

      const userId = result.insertId;

      // Generate token
      const token = jwt.sign(
        { id: userId, username, email },
        JWT_SECRET,
        { expiresIn: TOKEN_EXPIRY }
      );

      res.status(201).json({
        success: true,
        message: 'Account created successfully',
        token,
        user: { id: userId, username, email, fullName }
      });

    } finally {
      conn.release();
    }

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ success: false, message: 'Server error during signup' });
  }
});

// LOGIN
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password required' });
    }

    const conn = await pool.getConnection();

    try {
      // Find user
      const [rows] = await conn.query(
        'SELECT id, username, email, full_name, password_hash FROM users WHERE username = ?',
        [username]
      );

      if (rows.length === 0) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const user = rows[0];

      // Compare password
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);

      if (!isPasswordValid) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      // Generate token
      const token = jwt.sign(
        { id: user.id, username: user.username, email: user.email },
        JWT_SECRET,
        { expiresIn: TOKEN_EXPIRY }
      );

      res.json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.full_name
        }
      });

    } finally {
      conn.release();
    }

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

// VERIFY TOKEN
app.get('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// LOGOUT (frontend clears token)
app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

// ============================================
// DEVICE ENDPOINTS
// ============================================

// Get user devices
app.get('/api/devices', authenticateToken, async (req, res) => {
  try {
    const conn = await pool.getConnection();
    try {
      const [devices] = await conn.query(
        'SELECT id, name, category, location, brand, wattage, created_at FROM devices WHERE user_id = ?',
        [req.user.id]
      );
      res.json({ success: true, devices });
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('Get devices error:', error);
    res.status(500).json({ success: false, message: 'Error fetching devices' });
  }
});

// Add device
app.post('/api/devices', authenticateToken, async (req, res) => {
  try {
    const { name, category, location, brand, wattage } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Device name required' });
    }

    const conn = await pool.getConnection();
    try {
      const [result] = await conn.query(
        'INSERT INTO devices (user_id, name, category, location, brand, wattage) VALUES (?, ?, ?, ?, ?, ?)',
        [req.user.id, name, category, location, brand, wattage || 0]
      );

      res.status(201).json({
        success: true,
        message: 'Device added successfully',
        deviceId: result.insertId
      });
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('Add device error:', error);
    res.status(500).json({ success: false, message: 'Error adding device' });
  }
});

// Delete device
app.delete('/api/devices/:id', authenticateToken, async (req, res) => {
  try {
    const conn = await pool.getConnection();
    try {
      await conn.query(
        'DELETE FROM devices WHERE id = ? AND user_id = ?',
        [req.params.id, req.user.id]
      );
      res.json({ success: true, message: 'Device deleted' });
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('Delete device error:', error);
    res.status(500).json({ success: false, message: 'Error deleting device' });
  }
});

// Start server
app.listen(3000, () => {
  console.log('✅ Server running on http://localhost:3000');
  console.log('📊 Database: smarthome');
});