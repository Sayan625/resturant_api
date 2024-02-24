const express = require('express');
const mongoose = require('mongoose');
const resturant_route=require('./routes/resturants')
const user_route=require('./routes/user')

//connect to database
mongoose.connect(process.env.DB_URI)
.then(() => {console.log('Connected to MongoDB')})
.catch(err => console.error('Error connecting to MongoDB', err));

// Create an Express application
const app = express();
const port = 3000 || process.env.PORT;

app.use(express.json());

// Define a routes
app.use('/api/user/',user_route);
app.use('/api',resturant_route);




// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
