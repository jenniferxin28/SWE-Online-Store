const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const db = require('./config/db');
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
//test

// session config
app.use(session({
  secret: 'test-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } 
}));

// session storing
app.use((req, res, next) => {
  res.locals.loggedIn = req.session.loggedIn || false; 
  res.locals.username = req.session.username || null; 
  next();
});

// routers
app.use('/', indexRouter);
app.use('/users', usersRouter);

// Delete Route
app.post('/delete/:id', (req, res) => {
  const productID = req.params.id;
  const query = 'DELETE FROM Product WHERE productID = ?';

  db.query(query, [productID], (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send('Failed to delete product.');
    } else {
      res.redirect('/');
    }
  });
});

app.post('/add-product', (req, res) => {
  const { productName, description, category, price, stock, vipRequirement, sizeOptions } = req.body;

  const query = `
    INSERT INTO Product (productName, description, category, price, stock, vipRequirement, sizeOptions)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [productName, description, category, parseFloat(price), parseInt(stock), parseInt(vipRequirement), sizeOptions];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send('Failed to add product.');
    } else {
      res.redirect('/'); // Redirect back to the product list
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

