const express = require('express');
const bodyParser = require('body-parser');
const db = require('./config/db');
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/', indexRouter);
app.use('/users', usersRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
