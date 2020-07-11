const router = require("express").Router();
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const passport = require("passport");

const User = require("../models/user");
const Message = require("../models/message");
const { route } = require("./users");

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Members Only" });
});

// GET Signup page
router.get("/signup", (req, res, next) => {
  res.render("signup", { title: "Sign up" });
});
// POST signup
router.post("/signup", [
  body(["firstName", "lastName"])
    .trim()
    .notEmpty()
    .withMessage("First name and last name are required")
    .isAlphanumeric()
    .withMessage("Names must only contain letters and numbers")
    .escape(),
  body("username")
    .trim()
    .notEmpty()
    .withMessage("Username is required")
    .isLength({ min: 3, max: 16 })
    .withMessage("Username must be between 3 and 16 characters")
    .isAlphanumeric()
    .withMessage("Username contain only letters and numbers")
    .custom(async (username, { req }) => {
      const res = await User.findOne({ username });
      if (res) throw new Error("A user with that username already exists");
    })
    .escape(),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .notEmpty()
    .withMessage("Password is required")
    .escape(), // Escaping is okay because it will be escaped again when logging in
  body("confirmPassword")
    .notEmpty()
    .withMessage("Password confirmation is required")
    .custom((value, { req }) => value === req.body.password)
    .withMessage("Password confirmation must match password"),
  (req, res, next) => {
    const errors = validationResult(req);

    const { firstName, lastName, username } = req.body;

    if (!errors.isEmpty()) {
      res.render("signup", {
        title: "Sign up",
        user: { firstName, lastName, username },
        errors: errors.array(),
      });

      return;
    }

    // No errors - hash password, save user
    bcrypt.hash(req.body.password, 10, (err, hash) => {
      if (err) return next(err);

      const user = new User({
        firstName,
        lastName,
        username,
        password: hash,
      });
      user.save((err) => {
        if (err) return next(err);
        // req.login(user, (err) => {
        //   if (err) return next(err);
        // })
        res.redirect("/");
      });
    });
  },
]);

// GET login page
router.get("/login", (req, res, next) => {
  res.render("login", {
    title: "Log in",
    flashErrors: req.flash("error"),
  });
});
// POST login attempt
router.post(
  "/login",
  body("username").trim().escape(),
  body("password").escape(),
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true,
  })
);

// GET Logout route
router.get("/logout", (req, res, next) => {
  req.logout();
  res.redirect("/");
})

// GET member page
router.get("/member", (req, res, next) => {
  res.render("member", {
    title: "Become a Member",
  });
});
// POST member signup
router.post("/member", [
  body("memberCode").escape(),
  (req, res, next) => {
    // Compare passcodes
    bcrypt.compare(req.body.memberCode, process.env.MEMBER_HASH, (err, same) => {
      if (err) return next(err);

      // If wrong, rerender form with error: "That member code is incorrect."
      if (!same) {
        res.render("member", {
          title: "Become a Member",
          errors: ["That code is incorrect."],
        })
        return;
      }

      // If right, update user membership status
      const { user } = req;
      user.membership = "Member";
      user.save((err) => {
        if (err) return next(err);
        res.redirect("/")
      })

      
    })



    // ... etc
  },
]);


module.exports = router;
