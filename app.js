const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const sassMiddleware = require("node-sass-middleware");
const mongoose = require("mongoose");
require("dotenv").config();
const helmet = require("helmet");
const compression = require("compression");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");

const indexRouter = require("./routes/index");
const usersRouter = require("./routes/users");
const User = require("./models/user");

const app = express();

// MongoDB setup
const mongoDB = process.env.MONGODB_URI;
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on("error", console.error.bind(console, "mongo connection error"));

// Passport setup
passport.use(
  new LocalStrategy(function (username, password, done) {
    User.findOne({ username: username }, (err, user) => {
      if (err) return done(err);
      if (!user)
        return done(null, false, {
          message: "No user found for that username.",
        });
      bcrypt.compare(password, user.password, (err, same) => {
        if (err) return done(err);
        if (!same) return done(null, false, { message: "Incorrect password." });
        // Passwords match:
        return done(null, user);
      });
    });
  })
);
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => done(err, user));
})

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.use(helmet());
app.use(compression());
app.use(logger("dev"));
app.use(express.json());
app.use(cookieParser());
app.use(
  sassMiddleware({
    src: path.join(__dirname, "public"),
    dest: path.join(__dirname, "public"),
    indentedSyntax: false, // true = .sass and false = .scss
    sourceMap: true,
  })
);
app.use(express.static(path.join(__dirname, "public")));
// Auth middlewares
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(express.urlencoded({ extended: false }));
// Populate views with currentUser
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  next();
})

app.use("/", indexRouter);
app.use("/users", usersRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
