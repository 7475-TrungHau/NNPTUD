require('dotenv').config();
var createError = require('http-errors');
require('dotenv').config(); // Load environment variables from .env file
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
var mongoose = require('mongoose');
var dotenv = require('dotenv');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var authRouter = require('./routes/auth');
var userSubscriptionRouter = require('./routes/user/subscription'); // Add user subscription routes
var adminSubscriptionRoutes = require('./routes/admin/subscription'); // Add admin subscription routes
var apiMovieRouter = require('./routes/api/movies'); // Add API movie routes
var apiUserRouter = require('./routes/api/user'); // Add API user routes
var apiPaymentRouter = require('./routes/api/payment'); // Add API payment routes

var app = express();
app.use(cors({
  origin: '*'
}))
dotenv.config();
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Music Player</title>
    </head>
    <body>
      <h1>Nghe Nhạc Online</h1>
      
      <audio controls>
        <source src="https://drive.google.com/uc?export=download&id=1FEiVRAhw6L2BHkyUP8X6BFi3v5muBxmt" type="audio/mp3">
        Trình duyệt của bạn không hỗ trợ phát audio.
      </audio>
    </body>
    </html>
  `);
});
app.use('/users', usersRouter);
app.use('/auth', authRouter);
app.use('/api/user/subscriptions', userSubscriptionRouter); // Mount user subscription routes
app.use('/api/user', apiUserRouter); // Mount API user routes (handles /, /rating/:movieId, /update, etc.)
app.use('/api/movies', apiMovieRouter); // Mount API movie routes
app.use('/api/payment', apiPaymentRouter); // Mount API payment routes
app.use('/admin/movies', require('./routes/admin/movie'));
app.use('/admin/category', require('./routes/admin/category'));
app.use('/admin/episodes', require('./routes/admin/episode')); // Add episode routes
app.use('/admin/users', require('./routes/admin/user')); // Add user admin routes
app.use('/admin/packages', require('./routes/admin/package')); // Add package admin routes
app.use('/admin/subscriptions', adminSubscriptionRoutes); // Mount admin subscription routes

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

mongoose.connect('mongodb://localhost:27017/movie_db');
mongoose.connection.on('connected', () => {
  console.log('connected');
})

module.exports = app;
