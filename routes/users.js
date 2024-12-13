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

  const query = `
    SELECT 
      OrderTable.orderID,
      OrderTable.orderDate,
      OrderTable.status,
      Product.productName,
      OrderDetails.quantity,
      OrderDetails.price
    FROM OrderTable
    JOIN OrderDetails ON OrderTable.orderID = OrderDetails.orderID
    JOIN Product ON OrderDetails.productID = Product.productID
    WHERE OrderTable.cartID = (SELECT cartID FROM ShoppingCart WHERE userID = ?)
    ORDER BY OrderTable.orderDate DESC`;

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



// cart page (protected)
router.get('/cart', requireLogin, (req, res) => {
  const userID = req.session.userID;

  const query = `
    SELECT Product.productID, Product.productName, Product.price, ShoppingCartContains.quantity
    FROM ShoppingCart
    JOIN ShoppingCartContains ON ShoppingCart.cartID = ShoppingCartContains.cartID
    JOIN Product ON ShoppingCartContains.productID = Product.productID
    WHERE ShoppingCart.userID = ?`;

  db.query(query, [userID], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send('Internal Server Error');
    }

    // Calculate total cost
    const totalCost = results.reduce((sum, item) => sum + item.price * item.quantity, 0);

    res.render('cart', {
      username: req.session.username,
      cartItems: results,
      totalCost // Pass the total cost to the template
    });
  });
});


router.post('/cart/add', requireLogin, (req, res) => {
  const { productID, quantity } = req.body;
  const userID = req.session.userID;

  const addQuery = `
    INSERT INTO ShoppingCartContains (cartID, productID, quantity)
    VALUES ((SELECT cartID FROM ShoppingCart WHERE userID = ?), ?, ?)
    ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`;

  db.query(addQuery, [userID, productID, quantity], (err) => {
    if (err) {
      console.error('Error adding to cart:', err);
      return res.status(500).send('Failed to add to cart');
    }
    res.redirect('/users/cart');
  });
});

router.post('/cart/remove', requireLogin, (req, res) => {
  const { productID } = req.body;
  const userID = req.session.userID;

  const removeQuery = `
    DELETE FROM ShoppingCartContains
    WHERE cartID = (SELECT cartID FROM ShoppingCart WHERE userID = ?)
    AND productID = ?`;

  db.query(removeQuery, [userID, productID], (err) => {
    if (err) {
      console.error('Error removing from cart:', err);
      return res.status(500).send('Failed to remove item');
    }
    res.redirect('/users/cart');
  });
});
// place orders
router.post('/cart/place-order', requireLogin, (req, res) => {
  const userID = req.session.userID;


  const cartQuery = `
    SELECT Product.productID, Product.price, ShoppingCartContains.quantity
    FROM ShoppingCart
    JOIN ShoppingCartContains ON ShoppingCart.cartID = ShoppingCartContains.cartID
    JOIN Product ON ShoppingCartContains.productID = Product.productID
    WHERE ShoppingCart.userID = ?`;

  db.query(cartQuery, [userID], (err, cartItems) => {
    if (err) {
      console.error('Error fetching cart items:', err);
      return res.status(500).send('Failed to place order');
    }

    if (cartItems.length === 0) {
      return res.status(400).send('Your cart is empty!');
    }

    const insertOrderQuery = `
      INSERT INTO OrderTable (cartID, status, orderDate)
      VALUES ((SELECT cartID FROM ShoppingCart WHERE userID = ?), 'Pending', NOW())`;
    
    db.query(insertOrderQuery, [userID], (err, result) => {
      if (err) {
        console.error('Error creating order:', err);
        return res.status(500).send('Failed to place order');
      }

      const orderID = result.insertId; 

      // insert products into OrderDetails
      const insertOrderDetailsQuery = `
        INSERT INTO OrderDetails (orderID, productID, quantity, price)
        VALUES ?`;

      const orderDetails = cartItems.map(item => [
        orderID,
        item.productID,
        item.quantity,
        item.price
      ]);

      db.query(insertOrderDetailsQuery, [orderDetails], (err) => {
        if (err) {
          console.error('Error creating order details:', err);
          return res.status(500).send('Failed to place order');
        }

        // clear the cart
        const clearCartQuery = `
          DELETE FROM ShoppingCartContains
          WHERE cartID = (SELECT cartID FROM ShoppingCart WHERE userID = ?)`;

        db.query(clearCartQuery, [userID], (err) => {
          if (err) {
            console.error('Error clearing cart:', err);
            return res.status(500).send('Failed to clear cart');
          }

          res.redirect('/users/profile'); 
        });
      });
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
      const adminQuery = 'SELECT * FROM Admin WHERE adminID = ?';
      db.query(adminQuery, [results[0].userID], (err, adminResults) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).send('Internal Server Error');
        }

        req.session.isAdmin = adminResults.length > 0;
        return res.redirect('/');
      });
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

