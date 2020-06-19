"use strict";

const express = require("express");
const { check, validationResult } = require("express-validator");
const bcryptjs = require("bcryptjs");
const auth = require("basic-auth");
const { models } = require("./db");
const { User, Course } = models;

// Construct a router instance
const router = express.Router();

function asyncHandler(cb) {
  return async (req, res, next) => {
    try {
      await cb(req, res, next);
    } catch (err) {
      next(err);
    }
  };
}

const authenticateUser = async (req, res, next) => {
  let message = null;
  // Parse user credentials from Authorization header
  const credentials = auth(req);
  // If the user's credentials are available...
  if (credentials) {
    // Retrieve user data
    const users = await User.findAll();

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
        // Store the user on the Request object
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
      .withMessage('Please provide a value for "emailAddress"')
      .isEmail()
      .withMessage('Please provide a valid "email address"'),
    check("password")
      .exists({
        checkNull: true,
        checkFalsy: true,
      })
      .withMessage('Please provide a value for "password"'),
  ],
  asyncHandler(async (req, res) => {
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
    User.create(user);
    // set status to 201 and end response
    res.status(201).location("/").end();
  })
);

// Returns current authenticated user
router.get(
  "/users",
  authenticateUser,
  asyncHandler(async (req, res) => {
    const user = req.currentUser;
    res.json({
      firstName: user.firstName,
      lastName: user.lastName,
      emailAddress: user.emailAddress,
    });
  })
);

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
    const course = await Course.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: "user",
        },
      ],
    });
    if (course) {
      res.json(course);
    } else {
      res.status(404).json({ message: "Course not found" });
    }
  })
);

// Creates a course
router.post(
  "/courses",
  [
    check("title")
      .exists({
        checkNull: true,
        checkFalsy: true,
      })
      .withMessage('Please provide a value for "title"'),
    check("description")
      .exists({
        checkNull: true,
        checkFalsy: true,
      })
      .withMessage('Please provide a valid "description"'),
  ],
  authenticateUser,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map((error) => error.msg);
      return res.status(400).json({ errors: errorMessages });
    }

    const course = await Course.create(req.body);
    // Set status to 201 Created, set location to course URL and end response
    res
      .status(201)
      .location("/courses/" + course.id)
      .end();
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
      res.status(400).json({ message: "Course Not Found" });
    }
  })
);

module.exports = router;
