const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Ateeka1225@',
  database: 'smarthome'
});

// connect DB
db.connect((err) => {
  if (err) {
    console.log('DB error:', err);
  } else {
    console.log('MySQL Connected');
  }
});

// test route
app.get('/', (req, res) => {
  res.send('Smart Home Backend Running');
});


// =======================
// SIGNUP API (FIXED)
// =======================
app.post('/signup', (req, res) => {
  const { username, email, password } = req.body;

  // validation
  if (!username || !email || !password) {
    return res.json({ success: false, message: "All fields required" });
  }

  const sql = "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";

  db.query(sql, [username, email, password], (err, result) => {
    if (err) {
      console.log(err);
      return res.json({ success: false, message: "Database error" });
    }

    return res.json({ success: true, message: "User created successfully" });
  });
});


// start server
app.listen(3000, () => {
  console.log('Server running on port 3000');
});