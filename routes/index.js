const router = require("express").Router();
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");

const User = require("../models/user");
const Message = require("../models/message");

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
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
        password: hash
      });
      user.save((err) => {
        if (err) return next(err);
        res.redirect("/");
      });
    })

    
  }
]);

module.exports = router;
