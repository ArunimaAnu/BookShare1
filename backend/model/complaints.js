// models/Complaint.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ComplaintSchema = new Schema(
  {
    subject: {
      type: String,
      required: [true, 'A complaint must have a subject'],
      trim: true,
      maxlength: [100, 'Subject cannot be more than 100 characters']
    },
    description: {
      type: String,
      required: [true, 'A complaint must have a description'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters long']
    },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Resolved'],
      default: 'Pending'
    },
    adminResponse: {
      type: String,
      trim: true,
      default: ''
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A complaint must belong to a user']
    },
    metadata: {
      category: {
        type: String,
        enum: ['behavior', 'book_condition', 'no_show', 'payment', 'communication', 'other'],
        default: 'other'
      },
      exchangeId: {
        type: Schema.Types.ObjectId,
        ref: 'Exchange'
      },
      complaineeId: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      complaineeName: String,
      bookId: {
        type: Schema.Types.ObjectId,
        ref: 'Book'
      },
      bookTitle: String
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Create index for faster queries
ComplaintSchema.index({ user: 1 });
ComplaintSchema.index({ status: 1 });
ComplaintSchema.index({ createdAt: -1 });
ComplaintSchema.index({ 'metadata.exchangeId': 1 });
ComplaintSchema.index({ 'metadata.complaineeId': 1 });

const ComplaintModel = mongoose.model('Complaint', ComplaintSchema);

module.exports = ComplaintModel;