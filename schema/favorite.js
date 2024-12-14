const mongoose = require("mongoose");

const favoriteSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    photo_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Photo', required: true },
    date_time: { type: Date, default: Date.now }
});

// Create compound index to ensure a user can't favorite the same photo twice
favoriteSchema.index({ user_id: 1, photo_id: 1 }, { unique: true });

const Favorite = mongoose.model("Favorite", favoriteSchema);
module.exports = Favorite; 