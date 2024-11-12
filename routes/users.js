const express = require('express');
const db = require('../config/db');
const router = express.Router();

router.get('/login', (req, res) => {
  res.render('login', { error: null });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  // user validations
  const query = 'SELECT * FROM users WHERE username = ? AND password = ?';
  db.query(query, [username, password], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      res.render('login', { error: 'An error occurred. Please try again later.' });
    } else if (results.length > 0) {
      res.redirect('/users/profile');
    } else {
      res.render('login', { error: 'Invalid username or password' });
    }
  });
});

router.get('/profile', (req, res) => {
  res.render('profile', { username: 'user' });
});

module.exports = router;
