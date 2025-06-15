const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        default: '',
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const bookSchema = new mongoose.Schema({
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
    genre: {
        type: String,
        required: true,
        trim: true,
        enum: [
            'Fiction',
            'Non-Fiction',
            'Mystery',
            'Romance',
            'Science Fiction',
            'Fantasy',
            'Biography',
            'History',
            'Self-Help',
            'Business',
            'Health & Fitness',
            'Travel',
            'Cooking',
            'Art & Design',
            'Technology',
            'Education',
            'Children',
            'Young Adult',
            'Poetry',
            'Drama',
            'Horror',
            'Thriller',
            'Adventure',
            'Religion & Spirituality',
            'Philosophy',
            'Psychology',
            'Science',
            'Politics',
            'Economics',
            'Other'
        ]
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    image: {
        type: String,
        default: '/default-book-cover.jpg'
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    location: {
        type: String,
        required: true,
        trim: true
    },
    area: {
        type: String,
        trim: true,
        default: ''
    },
    needsReturn: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['available', 'borrowed','reserved'],
        default: 'available'
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true // Add index for faster lookups by userId
    },
    reviews: [reviewSchema],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Index for genre filtering
bookSchema.index({ genre: 1 });

// Virtual for calculating average rating
bookSchema.virtual('averageRating').get(function() {
    if (this.reviews.length === 0) {
        return 0;
    }
    
    const totalRating = this.reviews.reduce((acc, review) => acc + review.rating, 0);
    return totalRating / this.reviews.length;
});

// Update the rating field based on average rating when saving
bookSchema.pre('save', function(next) {
    if (this.reviews.length > 0) {
        this.rating = this.averageRating;
    }
    this.updatedAt = Date.now();
    next();
});

// Static method to find books by a specific user
bookSchema.statics.findByUserId = function(userId, limit = 0) {
    return this.find({ userId: userId })
               .sort({ createdAt: -1 })
               .limit(limit || 0)
               .populate('userId', 'name');
};

// Static method to find books by genre
bookSchema.statics.findByGenre = function(genre, limit = 0) {
    return this.find({ genre: genre })
               .sort({ createdAt: -1 })
               .limit(limit || 0)
               .populate('userId', 'name');
};

const BookModel = mongoose.model('Book', bookSchema);

module.exports = BookModel;