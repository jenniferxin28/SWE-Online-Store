const express = require('express');
const router = express.Router();
const db = require('../config/db');


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
      });
    });
  });
});



module.exports = router;
