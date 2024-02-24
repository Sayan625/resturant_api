// Import required module
const JWT = require('jsonwebtoken');

// Middleware function for authentication
const authenticate = (req, res, next) => {
  // Extract token from request headers
  const token = req.headers['access_token'];

  // Check if token exists
  if (!token){
      // If token is missing, send a response indicating unauthenticated
      res.send("you are not authenticated");
      return;
  } 

  // Verify the token using the JWT_KEY from environment variables
  JWT.verify(token, process.env.JWT_KEY, (err, data) => {
    // If an error occurs during token verification
    if (err) {
      // Send a response indicating an error occurred during authentication
      res.status(400).send("error occurred");
      return;
    } else {
      // If token is successfully verified, attach decoded token data to the request object
      req.data = data;
      // Proceed to the next middleware or route handler
      next();
    }
  });
};

// Export the authentication middleware function to be used in other files
module.exports = authenticate;
