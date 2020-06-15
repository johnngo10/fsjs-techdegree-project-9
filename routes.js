"use strict";

const express = require("express");
const { check, validationResult } = require("express-validator");
const bcryptjs = require("bcryptjs");
const auth = require("basic-auth");
const { models } = require("./db");
const { User, Course } = models;

function asyncHandler(cb) {
  return async (req, res, next) => {
    try {
      await cb(req, res, next);
    } catch (err) {
      next(err);
    }
  };
}

// Array used to keep track of user records created
const users = [];

// Construct a router instance
const router = express.Router();

// Creates a user
router.post(
  "/users",
  [
    check("firstName")
      .exists({
        checkNull: true,
        checkFalsy: true,
      })
      .withMessage('Please provide a value for "firstName"'),
    check("lastName")
      .exists({
        checkNull: true,
        checkFalsy: true,
      })
      .withMessage('Please provide a value for "lastName"'),
    check("emailAddress")
      .exists({
        checkNull: true,
        checkFalsy: true,
      })
      .withMessage('Please provide a value for "emailAddress"'),
    check("password")
      .exists({
        checkNull: true,
        checkFalsy: true,
      })
      .withMessage('Please provide a value for "password"'),
  ],
  (req, res) => {
    // Get validation result from request object
    const errors = validationResult(req);
    // If there are validation errors
    if (!errors.isEmpty()) {
      // Get list of error messages
      const errorMessages = errors.array().map((error) => error.msg);
      // Return the validation errors to the client
      return res.status(400).json({ errors: errorMessages });
    }
    // Get the user from request body
    const user = req.body;
    // Hash new user's password
    user.password = bcryptjs.hashSync(user.password);
    // Add user to the `users` array
    users.push(user);
    // set status to 201 and end response
    res.status(201).end();
  }
);

const authenticateUser = (req, res, next) => {
  let message = null;
  // Parse user credentials from Authorization header
  const credentials = auth(req);
  // If the user's credentials are available...
  if (credentials) {
    // Retrieve user data
    const user = users.find((u) => u.emailAddress === credentials.name);
    // If a user was successfully retrieved from the data
    if (user) {
      const authenticated = bcryptjs.compareSync(
        credentials.pass,
        user.password
      );
      // If password match
      if (authenticated) {
        console.log(`Authentication successful for user: ${user.emailAddress}`);
        req.currentUser = user;
      } else {
        message = `Authentication failure for user: ${user.emailAddress}`;
      }
    } else {
      message = `User not found for email address: ${credentials.name}`;
    }
  } else {
    message = "Auth header not found";
  }

  // If user authentication failed
  if (message) {
    console.warn(message);
    // Return response with 401 Unauthorize HTTP status code
    res.status(401).json({ message: "Access Denied" });
  } else {
    next();
  }
};

// Returns current authenticated user
router.get("/users", authenticateUser, (req, res) => {
  const user = req.currentUser;
  res.json({
    name: user.firstName,
    emailAddress: user.emailAddress,
  });
});

// Returns a list of courses
router.get(
  "/courses",
  authenticateUser,
  asyncHandler(async (req, res) => {
    const courses = await Course.findAll();
    res.json(courses);
  })
);

// Returns a course for the provided course id
router.get(
  "/courses/:id",
  asyncHandler(async (req, res) => {
    try {
      const course = await Course.findByPk(req.params.id);
      if (course) {
        res.json(course);
      } else {
        res.status(404).json({ message: "Quote not found" });
      }
      res.json(course);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  })
);

// Creates a course
router.post(
  "/courses",
  authenticateUser,
  asyncHandler(async (req, res) => {
    if (req.body.title && req.body.description && req.body.userId) {
      const course = await Course.create(req.body);
      res.status(201).end();
    } else {
      res
        .status(400)
        .json({ message: "Title, description and userId required." });
    }
  })
);

// Updates a course
router.put(
  "/courses/:id",
  authenticateUser,
  asyncHandler(async (req, res) => {
    const course = await Course.findByPk(req.params.id);
    if (req.body.title && req.body.description && req.body.userId) {
      await course.update(req.body);
      res.status(204).end();
    } else {
      res
        .status(400)
        .json({ message: "title, description and userID required" });
    }
  })
);

// Deletes a course
router.delete(
  "/courses/:id",
  authenticateUser,
  asyncHandler(async (req, res, next) => {
    const course = await Course.findByPk(req.params.id);
    if (course) {
      await course.destroy();
      res.status(204).end();
    } else {
      res.status(404).json({ message: "Quote Not Found" });
    }
  })
);

module.exports = router;
