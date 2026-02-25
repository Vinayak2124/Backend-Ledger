const mongoose = require('mongoose');

function connectToDB() {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
      .catch((err) => {
          console.error('MongoDB connection error:', err) 
          process.exit(1);
      });
}

module.exports = connectToDB;