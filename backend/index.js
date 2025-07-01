// Import express
const express = require('express');
require("./connection");
// Import cors
const cors = require('cors');
// Import models
const UserModel = require('./model/users');
const BookModel = require('./model/books');
const WishlistModel = require('./model/wishlist');
const NotificationModel = require('./model/notifications');
const ExchangeModel = require('./model/exchanges');
const ComplaintModel = require('./model/complaints');
// Import nodemailer at the top of your server file
const nodemailer = require('nodemailer');

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Initialize and setup express
const app = new express();

// Middleware
app.use(express.json());
const corsOptions = {
  origin: "http://localhost:5173",
  credentials: true
};
app.use(cors(corsOptions));

// Serve static files
app.use(express.static('public'));


// Configure email transporter (place this with your other configurations)
const transporter = nodemailer.createTransport({
  service: 'gmail', // or your preferred email service
  auth: {
    user:"bookexchange71@gmail.com",
    pass: "lamy wkkw xngk zxml",
  },
  // Or SMTP configuration if preferred:
  // host: process.env.SMTP_HOST,
  // port: process.env.SMTP_PORT,
  // secure: true,
  // auth: {
  //   user: process.env.SMTP_USER,
  //   pass: process.env.SMTP_PASSWORD,
  // }
});

// Create uploads directory if it doesn't exist
const uploadDir = 'public/uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// File upload configuration with multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, 'book-' + uniqueSuffix + extension);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  }
});

// Add error handling middleware for multer
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      status: "error",
      message: err.message
    });
  } else if (err) {
    return res.status(500).json({
      status: "error",
      message: err.message
    });
  }
  next();
});

// Set a port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Middleware to verify token
const verifyToken = (req, res, next) => {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if no token
  if (!token) {
    return res.status(401).json({ status: "error", message: "No token, authorization denied" });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, "yourSecretKey");

    // Add user from payload
    req.user = decoded;
    // Also set userId for backward compatibility with book routes
    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ status: "error", message: "Token is not valid" });
  }
};

// Admin-only middleware
const isAdmin = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ status: "error", message: "User not found" });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ status: "error", message: "Access denied. Admin role required." });
    }

    next();
  } catch (error) {
    console.error("Admin verification error:", error);
    res.status(500).json({ status: "error", message: "Server error" });
  }
};

// ==== USER AUTHENTICATION ROUTES ====

// API for user signup
app.post("/signup", async (req, res) => {
  let input = req.body;

  try {
    // Check if user already exists
    let existingUser = await UserModel.findOne({ email: input.email });
    if (existingUser) {
      return res.status(400).json({ status: "error", message: "User already exists" });
    }

    // Hash the password before storing
    let salt = await bcrypt.genSalt(10);
    let hashedPassword = await bcrypt.hash(input.password, salt);
    input.password = hashedPassword;

    // Save new user
    let newUser = new UserModel(input);
    await newUser.save();

    res.json({ status: "success", message: "Signup successful" });

  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ status: "error", message: "Signup failed", error: error.message });
  }
});

// API for user login
app.post("/login", async (req, res) => {
  let { email, password } = req.body;

  try {
    // Check if user exists
    let user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(400).json({ status: "error", message: "User not found" });
    }

    // Check password
    let isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ status: "error", message: "Invalid credentials" });
    }

    // Generate token with user role included in payload
    let token = jwt.sign(
      {
        userId: user._id,
        role: user.role
      },
      "yourSecretKey",
      { expiresIn: "1h" }
    );    res.json({
      status: "success",
      message: "Login successful",
      token,
      userRole: user.role,
      userId: user._id
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ status: "error", message: "Login failed", error: error.message });
  }
});

// Protected route to get user data
app.get("/user", verifyToken, async (req, res) => {
  try {
    // Find user by id without returning the password
    const user = await UserModel.findById(req.user.userId).select('-password');

    if (!user) {
      return res.status(404).json({ status: "error", message: "User not found" });
    }

    res.json({ status: "success", data: user });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ status: "error", message: "Server error" });
  }
});

// Update user profile
app.put("/user/update", verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const updates = req.body;

    // Don't allow email updates (as it's used for login)
    if (updates.email) {
      delete updates.email;
    }

    // Regular users shouldn't be able to change their role
    const currentUser = await UserModel.findById(userId);
    if (currentUser.role !== 'admin' && updates.role) {
      delete updates.role;
    }

    // If password is being updated, hash it
    if (updates.password) {
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(updates.password, salt);
    }

    // Update user with new data
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ status: "error", message: "User not found" });
    }

    res.json({ status: "success", message: "Profile updated successfully", data: updatedUser });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ status: "error", message: "Failed to update profile" });
  }
});

// Change password
app.post("/user/change-password", verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    // Find user
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ status: "error", message: "User not found" });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ status: "error", message: "Current password is incorrect" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    user.password = hashedPassword;
    await user.save();

    res.json({ status: "success", message: "Password changed successfully" });
  } catch (error) {
    console.error("Password change error:", error);
    res.status(500).json({ status: "error", message: "Failed to change password" });
  }
});

// Delete user account
app.delete("/user/delete", verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Delete the user
    const deletedUser = await UserModel.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ status: "error", message: "User not found" });
    }

    res.json({ status: "success", message: "Account deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ status: "error", message: "Failed to delete account" });
  }
});

// Logout endpoint (client-side token removal)
app.post("/logout", (req, res) => {
  res.json({ status: "success", message: "Logged out successfully" });
});

// ==== ADMIN ROUTES ====

// Admin Routes - Protected by admin middleware
const adminMiddleware = async (req, res, next) => {
  try {
    const token = req.header('x-auth-token');
    if (!token) {
      return res.status(401).json({ status: 'error', message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, 'yourSecretKey');
    const user = await UserModel.findById(decoded.userId);
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ status: 'error', message: 'Not authorized as admin' });
    }

    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ status: 'error', message: 'Token is not valid' });
  }
};

// Admin route to get all users
app.get('/admin/users', verifyToken, isAdmin, async (req, res) => {
  try {
    const users = await UserModel.find().select('-password');
    res.json({ status: 'success', data: users });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Server error' });
  }
});

// Admin route to get all complaints
app.get('/admin/complaints', verifyToken, isAdmin, async (req, res) => {
  try {
    const complaints = await ComplaintModel.find()
      .populate('user', 'name email')
      .populate('metadata.bookId', 'title author');
    
    if (!complaints) {
      return res.status(404).json({ status: 'error', message: 'No complaints found' });
    }
    
    res.json({ 
      status: 'success', 
      data: complaints.map(complaint => ({
        _id: complaint._id,
        subject: complaint.subject,
        description: complaint.description,
        status: complaint.status,
        adminResponse: complaint.adminResponse,
        user: complaint.user,
        category: complaint.metadata?.category,
        bookId: complaint.metadata?.bookId,
        complaineeId: complaint.metadata?.complaineeId,
        complaineeName: complaint.metadata?.complaineeName,
        createdAt: complaint.createdAt
      }))
    });
  } catch (err) {
    console.error('Error fetching complaints:', err);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to fetch complaints',
      error: err.message 
    });
  }
});

// Get all users (admin only)
app.get("/admin/users", verifyToken, isAdmin, async (req, res) => {
  try {
    const users = await UserModel.find().select('-password');
    res.json({ status: "success", data: users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ status: "error", message: "Server error" });
  }
});

// Update user role (admin only)
app.put("/admin/users/:userId/role", verifyToken, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({ status: "error", message: "Invalid role" });
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ status: "error", message: "User not found" });
    }

    res.json({ status: "success", message: "User role updated", data: updatedUser });
  } catch (error) {
    console.error("Role update error:", error);
    res.status(500).json({ status: "error", message: "Failed to update user role" });
  }
});

// Delete user (admin only)
app.delete("/admin/users/:userId", verifyToken, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    // Prevent admin from deleting themselves
    if (userId === req.userId) {
      return res.status(400).json({ status: "error", message: "Cannot delete your own admin account" });
    }

    const deletedUser = await UserModel.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ status: "error", message: "User not found" });
    }

    res.json({ status: "success", message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ status: "error", message: "Failed to delete user" });
  }
});

// ==== BOOK ROUTES ====
// Get all books (with pagination and filtering)
app.get("/books", async (req, res) => {
  try {
    // Extract query parameters for filtering and pagination
    const {
      limit = 20,
      page = 1,
      title,
      author,
      location,
      genre, // Added genre parameter
      language, // Added language parameter
      status = 'available'
    } = req.query;

    // Build the query object
    let query = { status }; // Default to only showing available books

    if (title) {
      query.title = { $regex: title, $options: 'i' };
    }

    if (author) {
      query.author = { $regex: author, $options: 'i' };
    }

    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    // Add genre filter if provided
    if (genre) {
      query.genre = { $regex: genre, $options: 'i' };
    }

    // Add language filter if provided
    if (language) {
      query.language = { $regex: language, $options: 'i' };
    }

    // Count total matching documents for pagination
    const total = await BookModel.countDocuments(query);

    // Execute the query with pagination
    const books = await BookModel.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('userId', 'name');

    // Fix image URLs to include the full path
    const booksWithFixedImages = books.map(book => {
      const bookObj = book.toObject();

      // If image doesn't start with http:// or https://, prepend the server URL
      if (bookObj.image && !bookObj.image.startsWith('http')) {
        bookObj.image = `http://localhost:${PORT}${bookObj.image}`;
      }

      return bookObj;
    });

    res.json({
      status: "success",
      data: booksWithFixedImages,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching books:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch books",
      error: error.message
    });
  }
});

// Get books by genre
app.get("/books/genre/:genreName", async (req, res) => {
  try {
    const { genreName } = req.params;
    const { limit = 20, page = 1 } = req.query;

    if (!genreName) {
      return res.status(400).json({
        status: "error",
        message: "Genre name is required"
      });
    }

    // Find books by genre using the static method
    const books = await BookModel.findByGenre(genreName)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Count total for pagination
    const total = await BookModel.countDocuments({ genre: genreName, status: 'available' });

    // Fix image URLs
    const booksWithFixedImages = books.map(book => {
      const bookObj = book.toObject();

      if (bookObj.image && !bookObj.image.startsWith('http')) {
        bookObj.image = `http://localhost:${PORT}${bookObj.image}`;
      }

      return bookObj;
    });

    res.json({
      status: "success",
      data: booksWithFixedImages,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching books by genre:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch books by genre",
      error: error.message
    });
  }
});

// Get popular genres (with book counts)
app.get("/books/genres/popular", async (req, res) => {
  try {
    // Aggregate to get counts of books per genre
    const genreCounts = await BookModel.aggregate([
      { $match: { status: 'available' } }, // Only include available books
      { $group: { _id: "$genre", count: { $sum: 1 } } },
      { $sort: { count: -1 } }, // Sort by count in descending order
      { $limit: 10 } // Get top 10 genres
    ]);

    res.json({
      status: "success",
      data: genreCounts.map(item => ({
        genre: item._id,
        count: item.count
      }))
    });
  } catch (error) {
    console.error("Error fetching popular genres:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch popular genres",
      error: error.message
    });
  }
});

// Get a single book by ID
app.get("/books/:id", async (req, res) => {
  try {
    const bookId = req.params.id;

    const book = await BookModel.findById(bookId)
      .populate('userId', 'name email')
      .populate({
        path: 'reviews.userId',
        select: 'name profileImage'
      });

    if (!book) {
      return res.status(404).json({
        status: "error",
        message: "Book not found"
      });
    }

    // Get similar books based on genre
    let similarBooks = [];
    if (book.genre) {
      similarBooks = await BookModel.find({
        genre: book.genre,
        _id: { $ne: bookId }, // Not the current book
        status: 'available'
      })
        .limit(4)
        .select('title author image genre rating')
        .populate('userId', 'name');

      // Fix image URLs for similar books
      similarBooks = similarBooks.map(similarBook => {
        const bookObj = similarBook.toObject();
        if (bookObj.image && !bookObj.image.startsWith('http')) {
          bookObj.image = `http://localhost:${PORT}${bookObj.image}`;
        }
        return bookObj;
      });
    }

    // Fix image URL to include the full path
    const bookObj = book.toObject();
    if (bookObj.image && !bookObj.image.startsWith('http')) {
      bookObj.image = `http://localhost:${PORT}${bookObj.image}`;
    }

    res.json({
      status: "success",
      data: {
        ...bookObj,
        similarBooks
      }
    });
  } catch (error) {
    console.error("Error fetching book:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch book",
      error: error.message
    });
  }
});

// IMPORTANT: Place this route BEFORE the "/books/:id" route in your server.js file
// The order of routes is critical - more specific routes should come first

// Get the books added by the current user
app.get("/my-books", verifyToken, async (req, res) => {
  try {
    // Get limit parameter for pagination (optional)
    const limit = parseInt(req.query.limit) || 0;

    // Make sure we have a valid userId
    if (!req.userId) {
      return res.status(401).json({
        status: "error",
        message: "User ID not found in token"
      });
    }

    // Build query to find books where userId matches the current user
    let query = BookModel.find({ userId: req.userId })
      .sort({ createdAt: -1 });

    // Apply limit if provided
    if (limit > 0) {
      query = query.limit(limit);
    }

    // Execute query
    const books = await query;

    // Fix image URLs
    const booksWithFixedImages = books.map(book => {
      const bookObj = book.toObject();

      if (bookObj.image && !bookObj.image.startsWith('http')) {
        bookObj.image = `http://localhost:${PORT}${bookObj.image}`;
      }

      return bookObj;
    });

    // Log result for debugging
    console.log(`Found ${books.length} books for user ${req.userId}`);

    res.json({
      status: "success",
      message: "Books retrieved successfully",
      data: booksWithFixedImages
    });
  } catch (error) {
    console.error("Get my books error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve books",
      error: error.message
    });
  }
});

// Get a specific book by ID
app.get("/books/:id", async (req, res) => {
  try {
    const bookId = req.params.id;

    const book = await BookModel.findById(bookId)
      .populate('userId', 'name')
      .populate('reviews.userId', 'name');

    if (!book) {
      return res.status(404).json({
        status: "error",
        message: "Book not found"
      });
    }

    // Fix image URL
    const bookObj = book.toObject();
    if (bookObj.image && !bookObj.image.startsWith('http')) {
      bookObj.image = `http://localhost:${PORT}${bookObj.image}`;
    }

    res.json({
      status: "success",
      data: bookObj
    });
  } catch (error) {
    console.error("Error fetching book:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch book",
      error: error.message
    });
  }
});

// Updated route handler for /books/my-books
app.get("/books/my-books", verifyToken, async (req, res) => {
  try {
    // Get limit parameter for pagination (optional)
    const limit = parseInt(req.query.limit) || 0;

    // Make sure we have a valid userId
    if (!req.userId) {
      return res.status(401).json({
        status: "error",
        message: "User ID not found in token"
      });
    }

    // Use the static method from our BookModel
    const books = await BookModel.findByUserId(req.userId, limit);

    // Fix image URLs
    const booksWithFixedImages = books.map(book => {
      const bookObj = book.toObject();

      if (bookObj.image && !bookObj.image.startsWith('http')) {
        bookObj.image = `http://localhost:${PORT}${bookObj.image}`;
      }

      return bookObj;
    });

    res.json({
      status: "success",
      message: "Books retrieved successfully",
      data: booksWithFixedImages
    });
  } catch (error) {
    console.error("Get my books error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve books",
      error: error.message
    });
  }
});

// Email sending function within the same file
const sendWishlistMatchEmail = async (data) => {
  try {
    const {
      email,
      userName,
      wishlistTitle,
      wishlistAuthor,
      bookTitle,
      bookAuthor,
      bookId
    } = data;

    const mailOptions = {
      from: `"Book Exchange" <${"bookexchange71@gmail.com"}>`,
      to: email,
      subject: `Good news! A book on your wishlist is available`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #4a4a4a;">Hello ${userName},</h2>
          <p>Great news! A book matching your wishlist item has just been added to BookShare.</p>
          <div style="background-color: #f7f7f7; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p style="margin: 5px 0;"><strong>Your wishlist item:</strong> "${wishlistTitle}" by ${wishlistAuthor}</p>
            <p style="margin: 5px 0;"><strong>Available book:</strong> "${bookTitle}" by ${bookAuthor}</p>
          </div>
          <p>Don't miss out! Check out the book details and contact the owner now.</p>
          <p style="margin-top: 25px; font-size: 0.9em; color: #777;">
            If you no longer wish to receive these notifications, you can update your preferences in your account settings.
          </p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Wishlist match email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending wishlist match email:', error);
    // Don't throw the error, just log it to prevent endpoint failure
    return null;
  }
};

// Email sending function for payment confirmations
const sendPaymentConfirmationEmail = async (data) => {
  try {
    const {
      email,
      userName,
      bookTitle,
      amount,
      paymentDate,
      isOwner,
      exchangeId
    } = data;

    let subject = isOwner 
      ? `Payment Confirmation: Deposit Received for "${bookTitle}"`
      : `Payment Receipt: Deposit for "${bookTitle}"`;

    let html = isOwner
      ? `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #4a4a4a;">Hello ${userName},</h2>
          <p>We're writing to confirm that the deposit for your book "${bookTitle}" has been paid.</p>
          <div style="background-color: #f7f7f7; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p style="margin: 5px 0;"><strong>Deposit Amount:</strong> $${amount}</p>
            <p style="margin: 5px 0;"><strong>Payment Date:</strong> ${paymentDate}</p>
          </div>
          <p>You can now proceed with the book handover. Visit the exchange details page to coordinate with the borrower.</p>
          <a href="http://localhost:5173/exchanges/${exchangeId}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">View Exchange Details</a>
          <p style="margin-top: 25px; font-size: 0.9em; color: #777;">Thank you for using our platform!</p>
        </div>
      `
      : `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #4a4a4a;">Hello ${userName},</h2>
          <p>Thank you for your payment! This email serves as your receipt for the deposit paid for "${bookTitle}".</p>
          <div style="background-color: #f7f7f7; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p style="margin: 5px 0;"><strong>Deposit Amount:</strong> $${amount}</p>
            <p style="margin: 5px 0;"><strong>Payment Date:</strong> ${paymentDate}</p>
            <p style="margin: 5px 0;"><strong>Transaction Status:</strong> Completed</p>
          </div>
          <p>The book owner has been notified and you can proceed with the book pickup/delivery arrangements.</p>
          <a href="http://localhost:5173/exchanges/${exchangeId}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">View Exchange Details</a>
          <p>Please keep this email for your records. The deposit will be refunded when you return the book in its original condition.</p>
          <p style="margin-top: 25px; font-size: 0.9em; color: #777;">Thank you for using our platform!</p>
        </div>
      `;

    const mailOptions = {
      from: `"Book Exchange"<${"bookexchange71@gmail.com"}>`,
      to: email,
      subject: subject,
      html: html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Payment confirmation email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending payment confirmation email:', error);
    return null;
  }
};

// Add a new book with genre support
app.post("/books", verifyToken, (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        status: "error",
        message: `Upload error: ${err.message}`
      });
    }
    next();
  });
}, async (req, res) => {
  try {
    const { title, author, description, genre, rating, location, area, needsReturn, language } = req.body;

    // Validate required fields
    if (!title || !author || !location || !genre) {
      return res.status(400).json({
        status: "error",
        message: "Title, author, location, and genre are required fields"
      });
    }

    // Create book object
    let bookData = {
      title,
      author,
      description: description || "",
      genre, // Genre is now required
      rating: parseFloat(rating) || 0,
      location,
      area: area || "",
      needsReturn: needsReturn === "true",
      language: language || "English",
      userId: req.userId
    };

    // Add image path if uploaded
    if (req.file) {
      bookData.image = `/uploads/${req.file.filename}`;
    }

    // Create and save new book
    let newBook = new BookModel(bookData);
    await newBook.save();

    // Check if this book matches any wishlist items
    const matchingWishlistItems = await WishlistModel.find({
      title: { $regex: new RegExp(title, 'i') },
      author: { $regex: new RegExp(author, 'i') },
      // Also match genre if wishlist has genre
      $or: [
        { genre: { $exists: false } }, // No genre in wishlist
        { genre: "" },                 // Empty genre in wishlist
        { genre: genre }               // Matching genre
      ],
      userId: { $ne: req.userId } // Not the book owner's wishlist
    });

    // Create notifications and send emails for matching wishlist items
    for (const item of matchingWishlistItems) {
      // Create in-app notification
      const notification = new NotificationModel({
        userId: item.userId,
        type: 'wishlist_match',
        bookId: newBook._id,
        message: `A book matching your wishlist item "${item.title}" by ${item.author} is now available!`,
        actionLink: `/books/${newBook._id}`
      });

      await notification.save();
      
      // Get user email for sending notification
      const user = await UserModel.findById(item.userId);
      if (user && user.email) {
        // Send email notification without waiting for it to complete
        sendWishlistMatchEmail({
          email: user.email,
          userName: user.name || user.username || 'Book lover',
          wishlistTitle: item.title,
          wishlistAuthor: item.author,
          bookTitle: title,
          bookAuthor: author,
          bookId: newBook._id
        }).catch(err => console.error('Email sending error:', err));
        // Note: We're not awaiting this to prevent delaying the response
      }
    }

    res.status(201).json({
      status: "success",
      message: "Book added successfully",
      data: newBook
    });

  } catch (error) {
    console.error("Add book error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to add book",
      error: error.message
    });
  }
});

// Update a book
app.put("/books/:id", verifyToken, (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        status: "error",
        message: `Upload error: ${err.message}`
      });
    }
    next();
  });
}, async (req, res) => {
  try {
    const bookId = req.params.id;
    const { title, author, description, genre, rating, location, area, needsReturn, language } = req.body;

    // Find book first to check ownership
    const book = await BookModel.findById(bookId);

    if (!book) {
      return res.status(404).json({
        status: "error",
        message: "Book not found"
      });
    }

    // Verify user owns this book
    if (book.userId.toString() !== req.userId) {
      return res.status(403).json({
        status: "error",
        message: "Unauthorized: You don't own this book"
      });
    }

    // Validate required fields
    if (!title || !author || !location || !genre) {
      return res.status(400).json({
        status: "error",
        message: "Title, author, location, and genre are required fields"
      });
    }

    // Prepare update data
    let updateData = {
      title,
      author,
      description: description || "",
      genre, // Genre is now required
      rating: parseFloat(rating) || 0,
      location,
      area: area || "",
      needsReturn: needsReturn === "true",
      language: language || "English",
      updatedAt: Date.now()
    };

    // Update image if provided
    if (req.file) {
      // Delete old image if it exists and is not the default
      if (book.image && !book.image.includes('default-book-cover') && fs.existsSync('public' + book.image)) {
        fs.unlinkSync('public' + book.image);
      }
      updateData.image = `/uploads/${req.file.filename}`;
    }

    // Update book
    const updatedBook = await BookModel.findByIdAndUpdate(
      bookId,
      updateData,
      { new: true, runValidators: true } // Return updated document and validate
    );

    res.json({
      status: "success",
      message: "Book updated successfully",
      data: updatedBook
    });

  } catch (error) {
    console.error("Update book error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to update book",
      error: error.message
    });
  }
});

// Delete a book
app.delete("/books/:id", verifyToken, async (req, res) => {
  try {
    const bookId = req.params.id;

    // Find book to check ownership
    const book = await BookModel.findById(bookId);

    if (!book) {
      return res.status(404).json({
        status: "error",
        message: "Book not found"
      });
    }

    // Verify user owns this book or is admin
    const isAdmin = req.user.role === 'admin';
    if (book.userId.toString() !== req.userId && !isAdmin) {
      return res.status(403).json({
        status: "error",
        message: "Unauthorized: You don't own this book"
      });
    }

    // Check if book is currently borrowed
    if (book.status === 'borrowed') {
      return res.status(400).json({
        status: "error",
        message: "Cannot delete a book that is currently borrowed"
      });
    }

    // Check for active exchanges
    const activeExchange = await ExchangeModel.findOne({
      bookId: bookId,
      status: { $in: ['pending', 'accepted', 'borrowed'] }
    });

    if (activeExchange) {
      return res.status(400).json({
        status: "error",
        message: "Cannot delete a book with active exchange requests"
      });
    }

    // Delete the book's image if it's not the default
    if (book.image && !book.image.includes('default-book-cover') && fs.existsSync('public' + book.image)) {
      fs.unlinkSync('public' + book.image);
    }

    // Delete the book
    await BookModel.deleteOne({ _id: bookId });

    res.json({
      status: "success",
      message: "Book deleted successfully"
    });

  } catch (error) {
    console.error("Delete book error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to delete book",
      error: error.message
    });
  }
});

// Add a review to a book
app.post("/books/:id/reviews", verifyToken, async (req, res) => {
  try {
    const bookId = req.params.id;
    const { rating, comment } = req.body;

    // Validate input
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        status: "error",
        message: "Rating is required and must be between 1 and 5"
      });
    }

    // Find the book
    const book = await BookModel.findById(bookId);

    if (!book) {
      return res.status(404).json({
        status: "error",
        message: "Book not found"
      });
    }

    // Prevent user from reviewing their own book
    if (book.userId.toString() === req.userId) {
      return res.status(400).json({
        status: "error",
        message: "You cannot review your own book"
      });
    }

    // Check if user has already reviewed this book
    const existingReview = book.reviews.find(
      review => review.userId.toString() === req.userId
    );

    if (existingReview) {
      return res.status(400).json({
        status: "error",
        message: "You have already reviewed this book"
      });
    }

    // Add the review
    book.reviews.push({
      userId: req.userId,
      rating: parseFloat(rating),
      comment: comment || "",
      createdAt: new Date()
    });

    await book.save();

    // Create notification for book owner
    const notification = new NotificationModel({
      userId: book.userId,
      type: 'review',
      bookId: book._id,
      message: `Someone left a ${rating}-star review on your book "${book.title}"`,
      actionLink: `/books/${book._id}`
    });

    await notification.save();

    res.status(201).json({
      status: "success",
      message: "Review added successfully",
      data: book
    });

  } catch (error) {
    console.error("Add review error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to add review",
      error: error.message
    });
  }
});

// ==== WISHLIST ROUTES ====

// Get user's wishlist
app.get("/wishlist", verifyToken, async (req, res) => {
  try {
    const wishlistItems = await WishlistModel.find({ userId: req.userId })
      .sort({ createdAt: -1 });

    res.json({
      status: 'success',
      data: wishlistItems
    });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch wishlist',
      error: error.message
    });
  }
});

// Add item to wishlist
app.post("/wishlist", verifyToken, async (req, res) => {
  try {
    const { title, author } = req.body;

    // Validate inputs
    if (!title || !author) {
      return res.status(400).json({
        status: 'error',
        message: 'Book title and author are required'
      });
    }

    // Check for duplicate
    const existingItem = await WishlistModel.findOne({
      userId: req.userId,
      title: { $regex: new RegExp('^' + title + '$', 'i') },
      author: { $regex: new RegExp('^' + author + '$', 'i') }
    });

    if (existingItem) {
      return res.status(400).json({
        status: 'error',
        message: 'This book is already in your wishlist'
      });
    }

    // Create new wishlist item
    const newWishlistItem = new WishlistModel({
      userId: req.userId,
      title,
      author
    });

    await newWishlistItem.save();

    // Check if any available books match this wishlist item
    const matchingBooks = await BookModel.find({
      title: { $regex: new RegExp(title, 'i') },
      author: { $regex: new RegExp(author, 'i') },
      status: 'available',
      userId: { $ne: req.userId } // Not owned by current user
    });

    // If matches found, create notification
    if (matchingBooks.length > 0) {
      const notification = new NotificationModel({
        userId: req.userId,
        type: 'wishlist_match',
        bookId: matchingBooks[0]._id,
        message: `A book matching your wishlist item "${title}" by ${author} is available!`,
        actionLink: `/books/${matchingBooks[0]._id}`
      });

      await notification.save();
    }

    res.status(201).json({
      status: 'success',
      message: 'Added to wishlist successfully',
      data: newWishlistItem
    });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to add to wishlist',
      error: error.message
    });
  }
});

// Remove item from wishlist
app.delete("/wishlist/:id", verifyToken, async (req, res) => {
  try {
    const wishlistItemId = req.params.id;

    // Find and ensure the item belongs to the user
    const wishlistItem = await WishlistModel.findOne({
      _id: wishlistItemId,
      userId: req.userId
    });

    if (!wishlistItem) {
      return res.status(404).json({
        status: 'error',
        message: 'Wishlist item not found or does not belong to you'
      });
    }

    // Delete the item
    await WishlistModel.deleteOne({ _id: wishlistItemId });

    res.json({
      status: 'success',
      message: 'Removed from wishlist successfully'
    });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to remove from wishlist',
      error: error.message
    });
  }
});

// ==== NOTIFICATION ROUTES ====

// Get user notifications
app.get("/notifications", verifyToken, async (req, res) => {
  try {
    const notifications = await NotificationModel.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(20); // Limit to 20 most recent notifications

    res.json({
      status: 'success',
      data: notifications
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
});

// Get unread notification count
app.get("/notifications/unread-count", verifyToken, async (req, res) => {
  try {
    const count = await NotificationModel.countDocuments({
      userId: req.userId,
      isRead: false
    });

    res.json({
      status: 'success',
      data: { count }
    });
  } catch (error) {
    console.error('Error counting unread notifications:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to count unread notifications',
      error: error.message
    });
  }
});

// Mark notification as read
app.put("/notifications/:id/read", verifyToken, async (req, res) => {
  try {
    const notificationId = req.params.id;

    // Find and ensure notification belongs to user
    const notification = await NotificationModel.findOne({
      _id: notificationId,
      userId: req.userId
    });

    if (!notification) {
      return res.status(404).json({
        status: 'error',
        message: 'Notification not found or does not belong to you'
      });
    }

    // Update notification to mark as read
    notification.isRead = true;
    await notification.save();

    res.json({
      status: 'success',
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
});

// Mark all notifications as read
app.put("/notifications/mark-all-read", verifyToken, async (req, res) => {
  try {
    await NotificationModel.updateMany(
      { userId: req.userId, isRead: false },
      { isRead: true }
    );

    res.json({
      status: 'success',
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to mark all notifications as read',
      error: error.message
    });
  }
});

// Delete a notification
app.delete("/notifications/:id", verifyToken, async (req, res) => {
  try {
    const notificationId = req.params.id;

    // Find and ensure notification belongs to user
    const notification = await NotificationModel.findOne({
      _id: notificationId,
      userId: req.userId
    });

    if (!notification) {
      return res.status(404).json({
        status: 'error',
        message: 'Notification not found or does not belong to you'
      });
    }

    // Delete the notification
    await NotificationModel.deleteOne({ _id: notificationId });

    res.json({
      status: 'success',
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete notification',
      error: error.message
    });
  }
});

// ==== EXCHANGE ROUTES ====

// Get all exchanges for the user (both as owner and borrower)
app.get("/exchanges", verifyToken, async (req, res) => {
  try {
    const exchanges = await ExchangeModel.find({
      $or: [
        { ownerId: req.userId },
        { borrowerId: req.userId }
      ]
    })
      .populate('bookId', 'title author image')
      .populate('ownerId', 'name')
      .populate('borrowerId', 'name')
      .sort({ updatedAt: -1 });

    // Fix image URLs for exchanges
    const exchangesWithFixedImages = exchanges.map(exchange => {
      const exchangeObj = exchange.toObject();

      // Fix the book image URL if it exists
      if (exchangeObj.bookId && exchangeObj.bookId.image && !exchangeObj.bookId.image.startsWith('http')) {
        exchangeObj.bookId.image = `http://localhost:${PORT}${exchangeObj.bookId.image}`;
      }

      return exchangeObj;
    });

    res.json({
      status: 'success',
      data: exchangesWithFixedImages
    });
  } catch (error) {
    console.error('Error fetching exchanges:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch exchanges',
      error: error.message
    });
  }
});

// Get a specific exchange by ID
app.get("/exchanges/:id", verifyToken, async (req, res) => {
  try {
    const exchangeId = req.params.id;

    const exchange = await ExchangeModel.findById(exchangeId)
      .populate('bookId', 'title author image needsReturn')
      .populate('ownerId', 'name email')
      .populate('borrowerId', 'name email');

    if (!exchange) {
      return res.status(404).json({
        status: 'error',
        message: 'Exchange not found'
      });
    }

    // Add review data to the response
    const exchangeData = exchange.toObject();

    // Include reviews in a more structured format
    exchangeData.reviews = {
      owner: exchange.ownerReview || null,
      borrower: exchange.borrowerReview || null
    };

    // Check if user is part of this exchange
    if (
      exchange.ownerId._id.toString() !== req.userId &&
      exchange.borrowerId._id.toString() !== req.userId &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not authorized to view this exchange'
      });
    }    // Fix image URL
    if (exchangeData.bookId && exchangeData.bookId.image && !exchangeData.bookId.image.startsWith('http')) {
      exchangeData.bookId.image = `http://localhost:${PORT}${exchangeData.bookId.image}`;
    }

    // Add review info for current user
    const isOwner = exchangeData.ownerId._id.toString() === req.userId;
    const isBorrower = exchangeData.borrowerId._id.toString() === req.userId;
    
    exchangeData.userReviewStatus = {
      canReview: ['returned', 'completed'].includes(exchangeData.status),
      hasReviewed: isOwner ? !!exchangeData.reviews.owner : !!exchangeData.reviews.borrower,
      userRole: isOwner ? 'owner' : 'borrower'
    };

    res.json({
      status: 'success',
      data: exchangeData
    });
  } catch (error) {
    console.error('Error fetching exchange:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch exchange',
      error: error.message
    });
  }
});

// Request to borrow a book
app.post("/exchanges/request", verifyToken, async (req, res) => {
  try {
    const { bookId, exchangeMethod, exchangeLocation } = req.body;

    // Validate input
    if (!bookId || !exchangeMethod) {
      return res.status(400).json({
        status: 'error',
        message: 'Book ID and exchange method are required'
      });
    }

    // Get the book and check if it's available
    const book = await BookModel.findById(bookId);

    if (!book) {
      return res.status(404).json({
        status: 'error',
        message: 'Book not found'
      });
    }

    if (book.status !== 'available') {
      return res.status(400).json({
        status: 'error',
        message: 'This book is not available for borrowing'
      });
    }

    // Prevent user from borrowing own book
    if (book.userId.toString() === req.userId) {
      return res.status(400).json({
        status: 'error',
        message: 'You cannot borrow your own book'
      });
    }

    // Check if there's already a pending request
    const existingRequest = await ExchangeModel.findOne({
      bookId,
      borrowerId: req.userId,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({
        status: 'error',
        message: 'You already have a pending request for this book'
      });
    }

    // Create exchange request
    const exchange = new ExchangeModel({
      bookId,
      ownerId: book.userId,
      borrowerId: req.userId,
      exchangeMethod,
      exchangeLocation: exchangeLocation || '',
      cautionDeposit: {
        amount: book.needsReturn ? 500 : 0, // Example deposit amount
        paid: false,
        refunded: false
      }
    });

    await exchange.save();

    // Update book status to reserved
    book.status = 'reserved';
    await book.save();

    // Create notification for book owner
    const notification = new NotificationModel({
      userId: book.userId,
      type: 'borrow_request',
      bookId: book._id,
      message: `Someone has requested to borrow your book "${book.title}"`,
      actionLink: `/exchanges/${exchange._id}`
    });

    await notification.save();

    res.status(201).json({
      status: 'success',
      message: 'Borrow request sent successfully',
      data: exchange
    });
  } catch (error) {
    console.error('Error creating borrow request:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create borrow request',
      error: error.message
    });
  }
});

// Respond to a borrow request (accept or reject)
app.put("/exchanges/:id/respond", verifyToken, async (req, res) => {
  try {
    const exchangeId = req.params.id;
    const { status } = req.body;

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Status must be either "accepted" or "rejected"'
      });
    }

    // Find the exchange and ensure user is the owner
    const exchange = await ExchangeModel.findById(exchangeId);

    if (!exchange) {
      return res.status(404).json({
        status: 'error',
        message: 'Exchange not found'
      });
    }

    if (exchange.ownerId.toString() !== req.userId) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not authorized to respond to this request'
      });
    }

    if (exchange.status !== 'pending') {
      return res.status(400).json({
        status: 'error',
        message: `Cannot ${status} a request that is not pending`
      });
    }

    // Update exchange status
    exchange.status = status;
    await exchange.save();

    // Update book status
    const book = await BookModel.findById(exchange.bookId);
    if (status === 'rejected') {
      book.status = 'available';
      await book.save();
    }

    // Create notification for borrower
    const notification = new NotificationModel({
      userId: exchange.borrowerId,
      type: 'borrow_request',
      bookId: exchange.bookId,
      message: `Your request to borrow "${book.title}" has been ${status}`,
      actionLink: `/exchanges/${exchange._id}`
    });

    await notification.save();

    res.json({
      status: 'success',
      message: `Request ${status} successfully`,
      data: exchange
    });
  } catch (error) {
    console.error(`Error responding to borrow request:`, error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to respond to borrow request',
      error: error.message
    });
  }
});

// Confirm book handover (after deposit payment if needed)
app.put("/exchanges/:id/handover", verifyToken, async (req, res) => {
  try {
    const exchangeId = req.params.id;

    // Find the exchange
    const exchange = await ExchangeModel.findById(exchangeId);

    if (!exchange) {
      return res.status(404).json({
        status: 'error',
        message: 'Exchange not found'
      });
    }

    // Verify the current user is either the borrower or owner
    if (
      exchange.ownerId.toString() !== req.userId &&
      exchange.borrowerId.toString() !== req.userId
    ) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not authorized to confirm this handover'
      });
    }

    // Verify the exchange is in the accepted state
    if (exchange.status !== 'accepted') {
      return res.status(400).json({
        status: 'error',
        message: 'Exchange must be in "accepted" state to confirm handover'
      });
    }

    // If caution deposit is required, ensure it's marked as paid
    if (exchange.cautionDeposit.amount > 0) {
      exchange.cautionDeposit.paid = true;
    }

    // Update exchange status and dates
    exchange.status = 'borrowed';
    exchange.borrowDate = new Date();

    // Set expected return date (e.g., 14 days later)
    const returnDate = new Date();
    returnDate.setDate(returnDate.getDate() + 14);
    exchange.expectedReturnDate = returnDate;

    await exchange.save();

    // Update book status
    const book = await BookModel.findById(exchange.bookId);
    book.status = 'borrowed';
    await book.save();

    // Remove book from borrower's wishlist if it exists
    await WishlistModel.findOneAndDelete({ 
      userId: exchange.borrowerId,
      title: book.title,
      author: book.author
    });

    // Create notification for the other party
    const recipientId = req.userId === exchange.ownerId.toString()
      ? exchange.borrowerId
      : exchange.ownerId;

    const notification = new NotificationModel({
      userId: recipientId,
      type: 'book_return',
      bookId: exchange.bookId,
      message: `The book handover has been confirmed. ${book.needsReturn ? `The book is due to be returned by ${returnDate.toLocaleDateString()}.` : ''}`,
      actionLink: `/exchanges/${exchange._id}`
    });

    await notification.save();

    res.json({
      status: 'success',
      message: 'Book handover confirmed successfully',
      data: exchange
    });
  } catch (error) {
    console.error('Error confirming book handover:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to confirm book handover',
      error: error.message
    });
  }
});

// Confirm book return
app.put("/exchanges/:id/confirm-return", verifyToken, async (req, res) => {
  try {
    const exchangeId = req.params.id;

    // Find the exchange and populate related data
    const exchange = await ExchangeModel.findById(exchangeId)
      .populate('bookId', 'title status')
      .populate('borrowerId', 'name email');

    if (!exchange) {
      return res.status(404).json({
        status: 'error',
        message: 'Exchange not found'
      });
    }

    // Verify the current user is the owner
    if (exchange.ownerId.toString() !== req.userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Only the book owner can confirm the return'
      });
    }

    // Verify the exchange is in the returnRequested state
    if (exchange.status !== 'returnRequested') {
      return res.status(400).json({
        status: 'error',
        message: 'Exchange must be in "returnRequested" state to confirm return'
      });
    }

    // Update exchange status and dates
    exchange.status = 'returned';
    exchange.actualReturnDate = new Date();

    // If caution deposit was paid, mark it as refunded
    if (exchange.cautionDeposit.paid) {
      exchange.cautionDeposit.refunded = true;
    }

    await exchange.save();

    // Update book status to available
    const book = await BookModel.findById(exchange.bookId);
    if (book) {
      book.status = 'available';
      await book.save();
    }

    // Create notification for borrower
    const notification = new NotificationModel({
      userId: exchange.borrowerId._id,
      type: 'book_return',
      bookId: exchange.bookId._id,
      message: `The owner has confirmed the return of "${exchange.bookId.title}". ${exchange.cautionDeposit.amount > 0 ? 'Your deposit will be refunded.' : ''}`,
      actionLink: `/exchanges/${exchange._id}`
    });

    await notification.save();

    // Send confirmation email to borrower
    const emailContent = `
      <h2>Book Return Confirmed</h2>
      <p>Hello ${exchange.borrowerId.name},</p>
      <p>The owner has confirmed the return of "${exchange.bookId.title}".</p>
      ${exchange.cautionDeposit.amount > 0 ? '<p>Your deposit will be refunded to you.</p>' : ''}
      <p>You can view the exchange details here: <a href="http://localhost:5173/exchanges/${exchange._id}">Exchange Details</a></p>
      <p>Thank you for using BookExchange!</p>
      <br>
      <p>Best regards,</p>
      <p>BookExchange Team</p>
    `;

    await transporter.sendMail({
      from: '"BookExchange" <bookexchange71@gmail.com>',
      to: exchange.borrowerId.email,
      subject: `Book Return Confirmed - ${exchange.bookId.title}`,
      html: emailContent
    });

    res.json({
      status: 'success',
      message: 'Book return confirmed successfully',
      data: exchange
    });
  } catch (error) {
    console.error('Error confirming book return:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to confirm book return',
      error: error.message
    });
  }
});

// Confirm book return (by owner)
app.put("/exchanges/:id/return", verifyToken, async (req, res) => {
  try {
    const exchangeId = req.params.id;

    // Find the exchange and populate related data
    const exchange = await ExchangeModel.findById(exchangeId)
      .populate('bookId', 'title status')
      .populate('borrowerId', 'name email');

    if (!exchange) {
      return res.status(404).json({
        status: 'error',
        message: 'Exchange not found'
      });
    }

    // Verify the current user is the owner
    if (exchange.ownerId.toString() !== req.userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Only the book owner can confirm the return'
      });
    }

    // Verify the exchange is in the returnRequested state
    if (exchange.status !== 'returnRequested') {
      return res.status(400).json({
        status: 'error',
        message: 'Exchange must be in "returnRequested" state to confirm return'
      });
    }

    // Update exchange status and dates
    exchange.status = 'returned';
    exchange.actualReturnDate = new Date();

    // If caution deposit was paid, mark it as refunded
    if (exchange.cautionDeposit.paid) {
      exchange.cautionDeposit.refunded = true;
    }

    await exchange.save();

    // Update book status to available
    const book = await BookModel.findById(exchange.bookId);
    if (book) {
      book.status = 'available';
      await book.save();
    }

    // Create notification for borrower
    const notification = new NotificationModel({
      userId: exchange.borrowerId._id,
      type: 'book_return',
      bookId: exchange.bookId._id,
      message: `The owner has confirmed the return of "${exchange.bookId.title}". ${exchange.cautionDeposit.amount > 0 ? 'Your deposit will be refunded.' : ''}`,
      actionLink: `/exchanges/${exchange._id}`
    });

    await notification.save();

    // Send confirmation email to borrower
    const emailContent = `
      <h2>Book Return Confirmed</h2>
      <p>Hello ${exchange.borrowerId.name},</p>
      <p>The owner has confirmed the return of "${exchange.bookId.title}".</p>
      ${exchange.cautionDeposit.amount > 0 ? '<p>Your deposit will be refunded to you.</p>' : ''}
      <p>You can view the exchange details here: <a href="http://localhost:5173/exchanges/${exchange._id}">Exchange Details</a></p>
      <p>Thank you for using BookExchange!</p>
      <br>
      <p>Best regards,</p>
      <p>BookExchange Team</p>
    `;

    await transporter.sendMail({
      from: '"BookExchange" <bookexchange71@gmail.com>',
      to: exchange.borrowerId.email,
      subject: `Book Return Confirmed - ${exchange.bookId.title}`,
      html: emailContent
    });

    res.json({
      status: 'success',
      message: 'Book return confirmed successfully',
      data: exchange
    });
  } catch (error) {
    console.error('Error confirming book return:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to confirm book return',
      error: error.message
    });
  }
});

// Submit a complaint
app.post("/complaints", verifyToken, async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        status: 'error',
        message: 'User authentication required'
      });
    }

    const { subject, description, category, exchangeId, complaineeId, complaineeName, bookId, bookTitle } = req.body;
    
    // Sanitize and validate fields
    const cleanSubject = subject ? subject.trim() : '';
    const cleanDescription = description ? description.trim() : '';
    const cleanCategory = category ? category.toLowerCase().trim() : '';

    const validationErrors = [];
    if (!cleanSubject) validationErrors.push('Subject is required');
    if (!cleanDescription) validationErrors.push('Description is required');
    if (cleanDescription.length < 10) validationErrors.push('Description must be at least 10 characters long');
    if (!cleanCategory) validationErrors.push('Category is required');
    if (!['behavior', 'book_condition', 'no_show', 'payment', 'communication', 'other'].includes(cleanCategory)) {
      validationErrors.push('Invalid category');
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    // Validate exchange if provided
    if (exchangeId) {
      const exchange = await ExchangeModel.findById(exchangeId);
      if (!exchange) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid exchange ID'
        });
      }
    }    // Create new complaint with validated structure
    const complaintData = {
      user: req.userId,
      subject: cleanSubject,
      description: cleanDescription,
      status: 'Pending',
      metadata: {
        category: cleanCategory
      }
    };

    // Add optional metadata fields if they exist
    if (exchangeId) complaintData.metadata.exchangeId = exchangeId;
    if (complaineeId) complaintData.metadata.complaineeId = complaineeId;
    if (complaineeName) complaintData.metadata.complaineeName = complaineeName;
    if (bookId) complaintData.metadata.bookId = bookId;
    if (bookTitle) complaintData.metadata.bookTitle = bookTitle;

    const complaint = new ComplaintModel(complaintData);

    await complaint.save();    // Create notification for admin
    const notification = new NotificationModel({
      userId: req.userId,
      type: 'complaint_submitted',
      message: `New complaint submitted: ${cleanSubject}`,
      actionLink: `/admin/complaints/${complaint._id}`
    });

    await notification.save();

    res.json({
      status: 'success',
      message: 'Complaint submitted successfully',
      data: complaint
    });
  } catch (error) {
    console.error('Error submitting complaint:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to submit complaint',
      error: error.message
    });
  }
});

// Get user's complaints
app.get("/complaints/user", verifyToken, async (req, res) => {
  try {
    const complaints = await ComplaintModel.find({
      $or: [
        { user: req.userId }
      ]
    })
    .populate('user', 'name')
    .populate('metadata.bookId', 'title')
    .sort({ createdAt: -1 });

    res.json({
      status: 'success',
      data: complaints
    });
  } catch (error) {
    console.error('Error fetching complaints:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch complaints',
      error: error.message
    });
  }
});

// Update complaint status and response (admin only)
app.put("/admin/complaints/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const { status, adminResponse } = req.body;

    if (!['Pending', 'In Progress', 'Resolved'].includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid status value'
      });
    }

    const complaint = await ComplaintModel.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({
        status: 'error',
        message: 'Complaint not found'
      });
    }

    // Update complaint
    complaint.status = status;
    if (adminResponse) {
      complaint.adminResponse = adminResponse;
    }
    await complaint.save();

    // If status is being set to Resolved, create notification for the user
    if (status === 'Resolved') {
      const notification = new NotificationModel({
        userId: complaint.user,
        type: 'complaint_resolved',
        message: `Your complaint regarding "${complaint.subject}" has been resolved`,
        actionLink: `/complaints/${complaint._id}`
      });
      await notification.save();
    }

    res.json({
      status: 'success',
      message: 'Complaint updated successfully',
      data: complaint
    });

  } catch (error) {
    console.error('Error updating complaint:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update complaint',
      error: error.message
    });
  }
});

// Cancel an exchange (can be done by either borrower or owner when in certain states)
app.put("/exchanges/:id/cancel", verifyToken, async (req, res) => {
  try {
    const exchangeId = req.params.id;

    // Find the exchange and populate book information for notifications
    const exchange = await ExchangeModel.findById(exchangeId)
      .populate('bookId', 'title status userId')
      .populate('borrowerId', 'name email')
      .populate('ownerId', 'name email');

    if (!exchange) {
      return res.status(404).json({
        status: 'error',
        message: 'Exchange not found'
      });
    }

    // Verify the current user is part of the exchange
    if (
      exchange.ownerId._id.toString() !== req.userId &&
      exchange.borrowerId._id.toString() !== req.userId
    ) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not authorized to cancel this exchange'
      });
    }

    // Check if exchange is in a state that can be cancelled
    const cancellableStates = ['pending', 'accepted'];
    if (!cancellableStates.includes(exchange.status)) {
      return res.status(400).json({
        status: 'error',
        message: `Exchange cannot be cancelled in "${exchange.status}" state`
      });
    }

    // Get the user who is cancelling
    const isOwner = exchange.ownerId._id.toString() === req.userId;
    const canceller = isOwner ? exchange.ownerId : exchange.borrowerId;
    const recipient = isOwner ? exchange.borrowerId : exchange.ownerId;

    // Update exchange status
    exchange.status = 'cancelled';
    await exchange.save();

    // Update book status to available
    const book = await BookModel.findById(exchange.bookId._id);
    if (book) {
      book.status = 'available';
      await book.save();
    }

    // Create notification for the other party
    const notification = new NotificationModel({
      userId: recipient._id,
      type: 'exchange_cancelled',
      bookId: exchange.bookId._id,
      message: `The exchange for "${exchange.bookId.title}" has been cancelled by ${canceller.name}.`,
      actionLink: `/exchanges/${exchange._id}`
    });

    await notification.save();

    // Send email to the other party
    const emailContent = `
      <h2>Book Exchange Cancelled</h2>
      <p>Hello ${recipient.name},</p>
      <p>The exchange for "${exchange.bookId.title}" has been cancelled by ${canceller.name}.</p>
      <p>You can view the exchange details here: <a href="http://localhost:5173/exchanges/${exchange._id}">Exchange Details</a></p>
      <p>Thank you for using BookExchange!</p>
      <br>
      <p>Best regards,</p>
      <p>BookExchange Team</p>
    `;

    await transporter.sendMail({
      from: '"BookExchange" <bookexchange71@gmail.com>',
      to: recipient.email,
      subject: `Exchange Cancelled - ${exchange.bookId.title}`,
      html: emailContent
    });

    res.json({
      status: 'success',
      message: 'Exchange cancelled successfully',
      data: exchange
    });
  } catch (error) {
    console.error('Error cancelling exchange:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to cancel exchange',
      error: error.message
    });
  }
});

// Update the caution deposit status (e.g., mark as paid)
app.put("/exchanges/:id/update-deposit", verifyToken, async (req, res) => {
  console.log('Update deposit endpoint hit:', req.params.id);
  try {
    const exchangeId = req.params.id;
    const { depositPaid } = req.body;
    console.log('Deposit update request:', { exchangeId, depositPaid });

    // Find the exchange
    const exchange = await ExchangeModel.findById(exchangeId);

    if (!exchange) {
      return res.status(404).json({
        status: 'error',
        message: 'Exchange not found'
      });
    }

    // Ensure the user is the borrower
    if (exchange.borrowerId.toString() !== req.userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Only the borrower can update the deposit status'
      });
    }

    // Update the caution deposit status
    exchange.cautionDeposit.paid = depositPaid;
    await exchange.save();

    // Get book details for email
    const book = await BookModel.findById(exchange.bookId);
    const owner = await UserModel.findById(exchange.ownerId);
    const borrower = await UserModel.findById(exchange.borrowerId);

    // Send email notifications about the deposit payment
    if (depositPaid) {
      try {
        // Send payment confirmation emails
        await sendPaymentConfirmationEmail({
          recipientEmail: owner.email,
          recipientName: owner.name,
          isOwner: true,
          bookTitle: book.title,
          amount: exchange.cautionDeposit.amount,
          paymentDate: new Date().toLocaleDateString(),
          exchangeId: exchange._id
        });

        await sendPaymentConfirmationEmail({
          recipientEmail: borrower.email,
          recipientName: borrower.name,
          isOwner: false,
          bookTitle: book.title,
          amount: exchange.cautionDeposit.amount,
          paymentDate: new Date().toLocaleDateString(),
          exchangeId: exchange._id
        });
      } catch (emailError) {
        console.error('Error sending payment emails:', emailError);
        // Continue execution even if email sending fails
      }
    }

    res.json({
      status: 'success',
      message: 'Deposit status updated successfully',
      data: {
        depositPaid
      }
    });
  } catch (error) {
    console.error('Error updating deposit status:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update deposit status',
      error: error.message
    });
  }
});

// Simple test endpoint to check if routing is working
app.get("/exchanges/test", (req, res) => {
  console.log('Test endpoint hit');
  res.json({
    status: 'success',
    message: 'API is working correctly'
  });
});

// Mark book as returned (by borrower)
app.put("/exchanges/:id/mark-returned", verifyToken, async (req, res) => {
  try {
    const exchangeId = req.params.id;
    console.log('Mark returned endpoint hit:', exchangeId);

    // Find the exchange and populate related data
    const exchange = await ExchangeModel.findById(exchangeId)
      .populate('bookId', 'title status')
      .populate('ownerId', 'name email');

    if (!exchange) {
      return res.status(404).json({
        status: 'error',
        message: 'Exchange not found'
      });
    }

    // Verify the current user is the borrower
    if (exchange.borrowerId.toString() !== req.userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Only the borrower can mark a book as returned'
      });
    }

    // Verify the exchange is in the borrowed state
    if (exchange.status !== 'borrowed') {
      return res.status(400).json({
        status: 'error',
        message: 'Exchange must be in "borrowed" state to mark as returned'
      });
    }

    // Update exchange status and set return request date
    exchange.status = 'returnRequested';
    exchange.returnRequestDate = new Date(); // Record when the return was requested
    await exchange.save();

    // Create notification for owner
    const notification = new NotificationModel({
      userId: exchange.ownerId._id,
      type: 'book_return',
      bookId: exchange.bookId._id,
      message: `The borrower has marked "${exchange.bookId.title}" as returned. Please confirm when you receive it.`,
      actionLink: `/exchanges/${exchange._id}`
    });

    await notification.save();

    // Send email to owner
    const emailContent = `
      <h2>Book Return Initiated</h2>
      <p>Hello ${exchange.ownerId.name},</p>
      <p>The borrower has marked "${exchange.bookId.title}" as returned.</p>
      <p>Once you receive the book, please confirm the return in the system.</p>
      <p>You can view the exchange details here: <a href="http://localhost:5173/exchanges/${exchange._id}">Exchange Details</a></p>
      <p>Thank you for using BookExchange!</p>
      <br>
      <p>Best regards,</p>
      <p>BookExchange Team</p>
    `;

    await transporter.sendMail({
      from: '"BookExchange" <bookexchange71@gmail.com>',
      to: exchange.ownerId.email,
      subject: `Book Return Initiated - ${exchange.bookId.title}`,
      html: emailContent
    });

    res.json({
      status: 'success',
      message: 'Book marked as returned successfully',
      data: exchange
    });
  } catch (error) {
    console.error('Error marking book as returned:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to mark book as returned',
      error: error.message
    });
  }
});

// Add a review to an exchange
app.post("/exchanges/:id/review", verifyToken, async (req, res) => {
  console.log(`Review submission for exchange ${req.params.id}:`, req.body);
  try {
    const { rating, comment } = req.body;
    const exchangeId = req.params.id;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        status: "error",
        message: "Rating is required and must be between 1 and 5"
      });
    }

    const exchange = await ExchangeModel.findById(exchangeId);
    
    if (!exchange) {
      return res.status(404).json({
        status: "error",
        message: "Exchange not found"
      });
    }

    // Determine if user is owner or borrower
    const isOwner = exchange.ownerId.toString() === req.userId;
    const isBorrower = exchange.borrowerId.toString() === req.userId;

    if (!isOwner && !isBorrower) {
      return res.status(403).json({
        status: "error",
        message: "You are not authorized to review this exchange"
      });
    }

    // Check if the exchange status allows for reviews
    if (!['returned', 'completed'].includes(exchange.status)) {
      return res.status(400).json({
        status: "error",
        message: "You can only review completed exchanges"
      });
    }

    // Check if the user has already submitted a review
    if ((isOwner && exchange.ownerReview && exchange.ownerReview.rating) || 
        (isBorrower && exchange.borrowerReview && exchange.borrowerReview.rating)) {
      return res.status(400).json({
        status: "error",
        message: "You have already reviewed this exchange"
      });
    }

    // Add the review based on who is submitting it
    if (isOwner) {
      exchange.ownerReview = {
        rating,
        comment,
        createdAt: new Date()
      };
      
      // Create notification for borrower
      await NotificationModel.create({
        userId: exchange.borrowerId,
        type: 'review',
        message: `${exchange.ownerId.name || 'The owner'} has left a ${rating}-star review for your exchange`,
        relatedId: exchangeId,
        isRead: false,
        createdAt: new Date()
      });
    } else {
      exchange.borrowerReview = {
        rating,
        comment,
        createdAt: new Date()
      };
      
      // Create notification for owner
      await NotificationModel.create({
        userId: exchange.ownerId,
        type: 'review',
        message: `${exchange.borrowerId.name || 'The borrower'} has left a ${rating}-star review for your exchange`,
        relatedId: exchangeId,
        isRead: false,
        createdAt: new Date()
      });
    }

    // Update exchange status to completed if both parties have reviewed
    if (exchange.ownerReview && exchange.ownerReview.rating && 
        exchange.borrowerReview && exchange.borrowerReview.rating && 
        exchange.status !== 'completed') {
      exchange.status = 'completed';
    }

    await exchange.save();

    return res.status(200).json({
      status: "success",
      message: "Review submitted successfully",
      data: {
        exchangeId,
        reviewType: isOwner ? 'ownerReview' : 'borrowerReview',
        rating,
        comment
      }
    });
  } catch (error) {
    console.error("Add exchange review error:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to add review"
    });
  }
});

module.exports = app;