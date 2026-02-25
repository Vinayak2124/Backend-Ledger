const mongoose = require("mongoose");

const blacklistSchema = new mongoose.Schema({
    token: {
        type: String,
        required: [true, 'Token is required for blacklisting'],
        unique: [true, 'Token is already blacklisted'],
        index: true
    },
  
}, {
    timestamps: true
})
blacklistSchema.index({ createdAt: 1 }, {
    expireAfterSeconds: 60 * 60 * 24 * 3 // Automatically remove blacklisted tokens after 3 days
}); // index on token for efficient querying
const tokenBlacklistModel = mongoose.model('blacklist', blacklistSchema);

module.exports = tokenBlacklistModel;