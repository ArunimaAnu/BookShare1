const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },    type: {
        type: String,
        enum: [
            'wishlist_match', 'borrow_request', 'return_reminder', 'deposit_paid',
            'book_return_request', 'book_return', 'new_complaint', 'review',
            'complaint_submitted', 'complaint_in_progress', 'complaint_response', 'complaint_resolved'
        ],
        required: true
    },
    bookId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book'
    },
    message: {
        type: String,
        required: true
    },
    isRead: {
        type: Boolean,
        default: false
    },
    actionLink: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const NotificationModel = mongoose.model('Notification', notificationSchema);

module.exports = NotificationModel;