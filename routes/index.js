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

// Middleware to ensure only admin access
const authorizeAdmin = (req, res, next) => {
  if (!req.session.loggedIn || !req.session.isAdmin) {
    return res.status(403).send('Access denied. Admins only.');
  }
  next();
};

router.get('/', (req, res) => {
  const category = req.query.category;
  let query = 'SELECT * FROM Product';
  const queryParams = [];

  if (category) {
    query += ' WHERE category = ?';
    queryParams.push(category);
  }

  db.query(query, queryParams, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return res.status(500).json({ error: 'Internal Server Error' });
      } else {
        return res.status(500).render('error', { error: 'Internal Server Error' });
      }
    }
    // support api clients too
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      res.status(200).json({
        category: category || 'All',
        products: results,
      });
    } else {
      res.render('home', { products: results });
    }
  });
});



router.get('/product/:id', (req, res) => {
  const productID = req.params.id;

  // prod details
  const productQuery = 'SELECT * FROM Product WHERE productID = ?';
  db.query(productQuery, [productID], (err, productResults) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    if (productResults.length === 0) {
      const errorResponse = { error: 'Product not found' };
      if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return res.status(404).json(errorResponse); // return JSON for API clients
      } else {
        return res.status(404).render('error', { error: errorResponse.error }); // html for browsers
      }
    }

    const product = productResults[0];

    // query to fetch product reviews
    const reviewQuery = 'SELECT * FROM Review WHERE productID = ?';
    db.query(reviewQuery, [productID], (err, reviewResults) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
      }

      const reviews = reviewResults;
      const averageRating =
        reviews.length > 0
          ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
          : 0;

      // handle both
      if (req.headers.accept && req.headers.accept.includes('application/json')) {
        // return JSON response for POSTMAN
        return res.status(200).json({
          product: {
            ...product,
            averageRating,
            reviews,
          },
        });
      } else {
        // render HTML page
        return res.render('product', {
          product,
          reviews,
          averageRating,
          reviewCount: reviews.length,
          loggedIn: req.session.loggedIn || false,
          isAdmin: req.session.isAdmin || false,
        });
      }
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
      if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return res.status(500).json({ error: 'Internal Server Error' });
      } else {
        return res.status(500).send('Internal Server Error');
      }
    }

    if (productResults.length === 0) {
      if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return res.status(404).json({ error: 'Product not found' });
      } else {
        return res.status(404).send('Product not found');
      }
    }

    const product = productResults[0];
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      res.status(200).json({ product });
    } else {
      res.render('review', { product, loggedIn: req.session.loggedIn || false });
    }
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
      if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return res.status(500).json({ error: 'Internal Server Error' });
      } else {
        return res.status(500).send('Internal Server Error');
      }
    }

    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      res.status(201).json({ message: 'Review submitted successfully' });
    } else {
      res.redirect(`/product/${productID}`);
    }
  });
});

// Add product (Admins only)
router.post('/add-product', authorizeAdmin,(req, res) => {
  const { productName, description, category, price, stock, vipRequirement, sizeOptions } = req.body;

  if (!productName || price == null || stock == null || vipRequirement == null) {
    return res.status(400).send('Product name, price, stock, and VIP requirement are required.');
  }

  const query = `INSERT INTO Product (productName, description, category, price, stock, vipRequirement, sizeOptions) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;
  const values = [productName, description, category, parseFloat(price), parseInt(stock), parseInt(vipRequirement), sizeOptions];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Failed to add product.');
    }
    res.redirect('/'); // Redirect back to the product list
  });
});

// Delete product (Admins only)
router.post('/delete/:id', authorizeAdmin, (req, res) => {
  const productID = req.params.id;
  const query = 'DELETE FROM Product WHERE productID = ?';

  db.query(query, [productID], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Failed to delete product.');
    }
    res.redirect('/');
  });
});


module.exports = router;
