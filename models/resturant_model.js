const mongoose = require('mongoose');

// returant schema
const resturant_model = new mongoose.Schema({
    name: String,
    restaurant_id: String,
    address: {
      building: String,
      coord: {
        type: [Number], 
      },
      street: String,
      zipcode: String,
    },
    borough: String,
    cuisine: String,
    desc: String,
    grades: [{
      date: Date,
      grade: String,
      score: Number
    }]
  });


module.exports = mongoose.model('restaurants', resturant_model);
