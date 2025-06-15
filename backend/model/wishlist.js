const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    author: {
        type: String,
        required: true,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Create a compound index for userId, title, and author to prevent duplicates
wishlistSchema.index({ userId: 1, title: 1, author: 1 }, { unique: true });

const WishlistModel = mongoose.model('Wishlist', wishlistSchema);

module.exports = WishlistModel;