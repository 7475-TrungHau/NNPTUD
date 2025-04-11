require('dotenv').config();
var createError = require('http-errors');
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
app.use('/admin/movies', require('./routes/admin/movie'));
app.use('/admin/category', require('./routes/admin/category'));
app.use('/admin/episodes', require('./routes/admin/episode')); // Add episode routes
app.use('/admin/users', require('./routes/admin/user')); // Add user admin routes
app.use('/admin/packages', require('./routes/admin/package')); // Add package admin routes

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
