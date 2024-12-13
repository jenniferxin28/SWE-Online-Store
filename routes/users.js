const express = require('express');
const db = require('../config/db');
const router = express.Router();

const requireLogin = (req, res, next) => {
  if (!req.session.loggedIn) {
    return res.redirect('/users/login'); // redirect to login
  }
  next();
};
// profile page (protected)
router.get('/profile', requireLogin, (req, res) => {
  const userID = req.session.userID;
  // const insertOrderQuery = `
  //   INSERT INTO OrderTable (cartID, status)
  //   SELECT cartID, 'Pending'
  //   FROM ShoppingCart
  //   WHERE userID = ?;
  // `;
  // db.query(insertOrderQuery, [userID], (err, result) => {
  //   if (err) {
  //     console.error('Error creating order:', err);
  //     return res.status(500).send('Failed to create order');
  //   }
  const query = `
    SELECT 
      OrderTable.orderID,
      OrderTable.orderDate,
      OrderTable.status,
      Product.productName,
      Product.price,
      ShoppingCartContains.quantity
    FROM OrderTable
    JOIN ShoppingCart ON OrderTable.cartID = ShoppingCart.cartID
    JOIN ShoppingCartContains ON ShoppingCart.cartID = ShoppingCartContains.cartID
    JOIN Product ON ShoppingCartContains.productID = Product.productID
    WHERE ShoppingCart.userID = ?`;

  db.query(query, [userID], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send('Internal Server Error');
    }

    res.render('profile', {
      username: req.session.username,
      orders: results 
    });
  });
});
//});


// cart page (protected)
router.get('/cart', requireLogin, (req, res) => {
  const userID = req.session.userID;

  const query = `
    SELECT Product.productName, Product.price, ShoppingCartContains.quantity
    FROM ShoppingCart
    
    JOIN ShoppingCartContains ON ShoppingCart.cartID = ShoppingCartContains.cartID
    JOIN Product ON ShoppingCartContains.productID = Product.productID
    WHERE ShoppingCart.userID = ?`;

  db.query(query, [userID], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send('Internal Server Error');
    }

    res.render('cart', {
      username: req.session.username,
      cartItems: results 
    });
  });
});




router.get('/login', (req, res) => {
  res.render('login', { error: null });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;


  const query = 'SELECT * FROM User WHERE username = ? AND password = ?';
  db.query(query, [username, password], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.render('login', { error: 'An error occurred. Please try again.' });
    }

    if (results.length > 0) {
      // successful
      req.session.loggedIn = true;
      req.session.username = results[0].username;
      req.session.userID = results[0].userID;
      return res.redirect('/');
    } else {
      // fail
      return res.render('login', { error: 'Invalid username or password.' });
    }
  });
});
router.get('/logout', (req, res) => {
  // destory session
  req.session.destroy(err => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).send('Error logging out. Please try again.');
    }
    // redirect to home
    res.redirect('/');
  });
});

module.exports = router;

