const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Middleware to ensure only registered users can post reviews
const ensureRegisteredUser = (req, res, next) => {
  if (!req.session.loggedIn || req.session.isAdmin) {
    return res.status(403).send('Only registered users can submit reviews.');
  }
  next();
};

router.get('/', (req, res) => {
  const query = 'SELECT * FROM Product';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send('Internal Server Error');
    }
    res.render('home', { products: results });
  });
});

router.get('/product/:id', (req, res) => {
  const productID = req.params.id;
  // prod details
  const productQuery = 'SELECT * FROM Product WHERE productID = ?';
  db.query(productQuery, [productID], (err, productResults) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send('Internal Server Error');
    }

    if (productResults.length === 0) {
      return res.status(404).send('Product not found');
    }
    // prod reviews
    const product = productResults[0];
    const reviewQuery = 'SELECT * FROM Review WHERE productID = ?';
    db.query(reviewQuery, [productID], (err, reviewResults) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).send('Internal Server Error');
      }
      const reviews = reviewResults;
      // calc avg
      const averageRating =
        reviews.length > 0
          ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
          : 0;

      res.render('product', {
        product,
        reviews,
        averageRating,
        reviewCount: reviews.length,
        loggedIn: req.session.loggedIn || false,
        isAdmin: req.session.isAdmin || false, // Pass admin status to the view
      });
    });
  });
});

// Route to render the review form
router.get('/product/:id/review', ensureRegisteredUser, (req, res) => {
  const productID = req.params.id;

  const productQuery = 'SELECT * FROM Product WHERE productID = ?';
  db.query(productQuery, [productID], (err, productResults) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send('Internal Server Error');
    }

    if (productResults.length === 0) {
      return res.status(404).send('Product not found');
    }

    const product = productResults[0];
    res.render('review', { product, loggedIn: req.session.loggedIn || false });
  });
});

// route for review submissions
router.post('/product/:id/review', ensureRegisteredUser, (req, res) => {
  const { rating, comment } = req.body;
  const productID = req.params.id;
  const userID = req.session.userID; 

  const query = 'INSERT INTO Review (userID, productID, rating, comment) VALUES (?, ?, ?, ?)';
  db.query(query, [userID, productID, rating, comment], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send('Internal Server Error');
    }
    res.redirect(`/product/${productID}`); 
  });
});

module.exports = router;
