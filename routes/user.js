// Import required modules
const router = require('express').Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const user_model = require('../models/user_model.js');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Route for user registration
router.post('/register', async (req, res) => {
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(req.body.password, salt);
    const data = { ...req.body, 'password': hash }; // Replace plain password with hashed password
    const newUser = new user_model(data); // Create a new user instance with hashed password
    try {
        const user = await newUser.save(); // Save user to the database
        if (!user) {
            res.status(400).send("not created"); // Send error message if user creation fails
            return;
        }
        res.status(200).send(user); // Send success response with created user data
    } catch (error) {
        console.log(error); // Log any errors that occur during user registration
        res.status(400).send(error); // Send error response
    }
});

// Route for user login
router.post('/login', async (req, res) => {
    try {
        const user = await user_model.findOne({ email: req.body.email }); // Find user by email

        // Compare provided password with hashed password in the database
        const isCorrect = await bcrypt.compare(req.body.password, user.password);

        // If passwords do not match, return incorrect credentials message
        if (!isCorrect)
            return res.status(400).json("Incorrect credentials");

        // Generate JWT token for authenticated user
        const token = jwt.sign({
            id: user._id
        }, process.env.JWT_KEY); // Sign JWT token with secret key from environment variables

        // Exclude password field from user data
        const { password, ...others } = user._doc;

        // Send success response with user data and JWT token
        res.status(200).json({ ...others, token });
    } catch (error) {
        console.log(error); // Log any errors that occur during user login
        res.status(400).send(error); // Send error response
    }
});

module.exports = router; // Export router to be used in other files
