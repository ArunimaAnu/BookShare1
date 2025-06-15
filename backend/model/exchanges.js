const mongoose = require('mongoose');

const exchangeSchema = new mongoose.Schema({
    bookId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
        required: true
    },
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    borrowerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'borrowed', 'returned','returnRequested','completed', 'cancelled'],
        default: 'pending'
    },
    exchangeMethod: {
        type: String,
        enum: ['in_person', 'mail', 'other'],
        required: true
    },
    exchangeLocation: {
        type: String,
        default: ''
    },
    cautionDeposit: {
        amount: {
            type: Number,
            default: 0
        },
        paid: {
            type: Boolean,
            default: false
        },
        refunded: {
            type: Boolean,
            default: false
        }
    },
    borrowDate: {
        type: Date
    },
    expectedReturnDate: {
        type: Date
    },
    actualReturnDate: {
        type: Date
    },
    ownerReview: {
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        comment: {
            type: String,
            trim: true
        },
        createdAt: {
            type: Date
        }
    },
    borrowerReview: {
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        comment: {
            type: String,
            trim: true
        },
        createdAt: {
            type: Date
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Pre-save middleware to update timestamps
exchangeSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const ExchangeModel = mongoose.model('Exchange', exchangeSchema);

module.exports = ExchangeModel;