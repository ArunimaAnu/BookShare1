import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeft, FaStar, FaEdit, FaHeart, FaExchangeAlt, FaUser, FaMapMarkerAlt, FaCalendarAlt, FaTags, FaEnvelope } from 'react-icons/fa';
import './BookDetail.css';

const BookDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [book, setBook] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [review, setReview] = useState({
    rating: 5,
    comment: ''
  });
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [addedToWishlist, setAddedToWishlist] = useState(false);
  
  useEffect(() => {
    const fetchBookAndUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
        
        // Fetch book details
        const bookResponse = await axios.get(`http://localhost:5000/books/${id}`, {
          headers: {
            'x-auth-token': token
          }
        });
        
        if (bookResponse.data.status === 'success') {
          setBook(bookResponse.data.data);
        } else {
          setError('Failed to load book details');
        }
        
        // Fetch user data to check if the book belongs to the current user
        const userResponse = await axios.get('http://localhost:5000/user', {
          headers: {
            'x-auth-token': token
          }
        });
        
        if (userResponse.data.status === 'success') {
          setUserId(userResponse.data.data._id);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.response?.data?.message || 'Error loading book details');
        
        if (err.response && err.response.status === 404) {
          navigate('/books');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchBookAndUserData();
  }, [id, navigate]);
  
  const isOwner = book && userId && book.userId._id === userId;
  const canReview = book && userId && book.userId._id !== userId && 
    !book.reviews.some(review => review.userId._id === userId);
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };
  
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    // Add full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={`full-${i}`} className="star full">★</span>);
    }
    
    // Add half star if needed
    if (hasHalfStar) {
      stars.push(<span key="half" className="star half">★</span>);
    }
    
    // Add empty stars
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<span key={`empty-${i}`} className="star empty">☆</span>);
    }
    
    return stars;
  };
  
  const handleReviewChange = (e) => {
    const { name, value } = e.target;
    setReview({
      ...review,
      [name]: value
    });
  };
  
  const handleRatingChange = (rating) => {
    setReview({
      ...review,
      rating
    });
  };
  
  const submitReview = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      const response = await axios.post(
        `http://localhost:5000/books/${id}/reviews`,
        review,
        {
          headers: {
            'x-auth-token': token
          }
        }
      );
      
      if (response.data.status === 'success') {
        // Update the book data with the new review
        setBook(response.data.data);
        setShowReviewForm(false);
        setReview({
          rating: 5,
          comment: ''
        });
      } else {
        setError(response.data.message || 'Failed to submit review');
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      setError(err.response?.data?.message || 'Error submitting review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  const submitExchangeRequest = async (e) => {
    if (e) e.preventDefault();
    setSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      const requestData = {
        bookId: id,
        exchangeMethod: 'in_person', // Required field
        exchangeLocation: '' // Optional but we'll include it with empty string
      };
      
      const response = await axios.post(
        'http://localhost:5000/exchanges/request',
        requestData,
        {
          headers: {
            'x-auth-token': token
          }
        }
      );
      
      if (response.data.status === 'success') {
        // Close the request form
        setShowRequestForm(false);
        // Navigate to the user dashboard
        navigate('/user-dashboard');
      } else {
        setError(response.data.message || 'Failed to submit exchange request');
      }
    } catch (err) {
      console.error('Error submitting exchange request:', err);
      const errorMsg = err.response?.data?.message || 'Error submitting exchange request. Please try again.';
      setError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };
  
  const addToWishlist = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      setSubmitting(true);
      
      const response = await axios.post(
        'http://localhost:5000/wishlist',
        {
          title: book.title,
          author: book.author,
          genre: book.genre // Include genre when adding to wishlist
        },
        {
          headers: {
            'x-auth-token': token
          }
        }
      );
      
      if (response.data.status === 'success') {
        setAddedToWishlist(true);
      } else {
        setError(response.data.message || 'Failed to add to wishlist');
      }
    } catch (err) {
      console.error('Error adding to wishlist:', err);
      if (err.response?.data?.message === 'This book is already in your wishlist') {
        setAddedToWishlist(true);
      } else {
        setError(err.response?.data?.message || 'Error adding to wishlist. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="book-detail-loading">
        <div className="spinner"></div>
        <p>Loading book details...</p>
      </div>
    );
  }
  
  if (!book) {
    return (
      <div className="book-detail-error">
        <h2>Book Not Found</h2>
        <p>The book you're looking for doesn't exist or has been removed.</p>
        <button onClick={() => navigate('/books')} className="browse-books-button">
          Browse Books
        </button>
      </div>
    );
  }
  
  return (
    <div className="book-detail-container">
      <div className="book-detail-header">
        <button onClick={() => navigate('/books')} className="back-button">
          <FaArrowLeft /> Back to Browse Books
        </button>
        {isOwner && (
          <button 
            onClick={() => navigate(`/edit-book/${id}`)} 
            className="edit-button"
          >
            <FaEdit /> Edit Book
          </button>
        )}
      </div>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <div className="book-detail-content">
        <div className="book-image-container">
          <img 
            src={book.image || '/default-book-cover.jpg'} 
            alt={book.title} 
            className="book-image"
          />
          
          <div className="book-actions">
            {!isOwner && (
              <>
                <button 
                  onClick={() => setShowRequestForm(true)}
                  className="request-button"
                  disabled={book.status !== 'available' || submitting}
                >
                  <FaExchangeAlt /> Borrow This Book
                </button>
                
                <button 
                  onClick={addToWishlist}
                  className="wishlist-button"
                  disabled={addedToWishlist || submitting}
                >
                  <FaHeart /> {addedToWishlist ? 'Added to Wishlist' : 'Add to Wishlist'}
                </button>
              </>
            )}
          </div>
        </div>
        
        <div className="book-info">
          <h1 className="book-title">{book.title}</h1>
          <p className="book-author">by {book.author}</p>
          
          {book.genre && (
            <div className="book-genre-detail">
              <FaTags className="genre-icon" />
              <span className="genre-badge">{book.genre}</span>
            </div>
          )}
          
          <div className="book-rating-container">
            <div className="book-rating">
              <div className="stars">
                {renderStars(book.rating || 0)}
              </div>
              <span className="rating-text">
                {book.rating?.toFixed(1) || 'No ratings yet'} ({book.reviews?.length || 0} reviews)
              </span>
            </div>
            
            <div className="book-status">
              <span className={`status-badge ${book.status}`}>
                {book.status.charAt(0).toUpperCase() + book.status.slice(1)}
              </span>
              <span className={`status-badge ${book.needsReturn ? 'return' : 'no-return'}`}>
                {book.needsReturn ? 'Needs Return' : 'Gift'}
              </span>
            </div>
          </div>
          
          <div className="book-meta">
            <div className="meta-item">
              <FaUser />
              <span>Owner: {book.userId?.name || 'Unknown'}</span>
            </div>
            
            <div className="meta-item">
              <FaEnvelope />
              <span>Contact: {book.userId?.email || 'N/A'}</span>
            </div>
            
            <div className="meta-item">
              <FaMapMarkerAlt />
              <span>Location: {book.location}{book.area ? `, ${book.area}` : ''}</span>
            </div>
            
            <div className="meta-item">
              <FaCalendarAlt />
              <span>Added: {formatDate(book.createdAt)}</span>
            </div>
          </div>
          
          {book.description && (
            <div className="book-description">
              <h3>Description</h3>
              <p>{book.description}</p>
            </div>
          )}
          
          {book.needsReturn && (
            <div className="caution-deposit-info">
              <h3>Caution Deposit Required</h3>
              <p>
                This book requires a refundable caution deposit. The deposit will be refunded when the book is returned in good condition.
              </p>
            </div>
          )}
          
          <div className="reviews-section">
            <div className="section-header">
              <h3>Reviews</h3>
              {canReview && (
                <button 
                  onClick={() => setShowReviewForm(true)}
                  className="write-review-button"
                >
                  Write a Review
                </button>
              )}
            </div>
            
            {showReviewForm && (
              <div className="review-form-container">
                <h4>Write Your Review</h4>
                <form onSubmit={submitReview} className="review-form">
                  <div className="form-group">
                    <label>Rating</label>
                    <div className="star-rating-select">
                      {[1, 2, 3, 4, 5].map(star => (
                        <span
                          key={star}
                          className={`star ${star <= review.rating ? 'filled' : ''}`}
                          onClick={() => handleRatingChange(star)}
                        >
                          <FaStar />
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="comment">Your Review</label>
                    <textarea
                      id="comment"
                      name="comment"
                      value={review.comment}
                      onChange={handleReviewChange}
                      placeholder="Share your thoughts about this book..."
                      rows="4"
                      required
                    ></textarea>
                  </div>
                  
                  <div className="review-form-actions">
                    <button 
                      type="button" 
                      onClick={() => setShowReviewForm(false)}
                      className="cancel-button"
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="submit-button"
                      disabled={submitting}
                    >
                      {submitting ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </div>
                </form>
              </div>
            )}
            
            <div className="reviews-list">
              {book.reviews && book.reviews.length > 0 ? (
                book.reviews.map((review, index) => (
                  <div key={index} className="review-item">
                    <div className="review-header">
                      <div className="reviewer-info">
                        <span className="reviewer-name">{review.userId?.name || 'Anonymous'}</span>
                        <span className="review-date">{formatDate(review.createdAt)}</span>
                      </div>
                      <div className="review-rating">
                        {renderStars(review.rating)}
                      </div>
                    </div>
                    <div className="review-content">
                      {review.comment}
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-reviews">
                  <p>No reviews yet. Be the first to review this book!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {showRequestForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Borrow Request</h3>
              <button 
                onClick={() => setShowRequestForm(false)}
                className="close-modal"
                disabled={submitting}
              >
                &times;
              </button>
            </div>
            
            <div className="modal-body">
              <p>
                You're requesting to borrow "<strong>{book.title}</strong>" by {book.author}.
              </p>
              {book.needsReturn && (
                <p className="caution-note">
                  Note: This book requires a caution deposit of ₹500, which will be refunded when the book is returned in good condition.
                </p>
              )}
              <p>Would you like to send a borrow request to the book owner?</p>
              
              <div className="modal-actions">
                <button 
                  type="button" 
                  onClick={() => setShowRequestForm(false)}
                  className="cancel-button"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button 
                  onClick={submitExchangeRequest}
                  className="submit-button"
                  disabled={submitting}
                >
                  {submitting ? 'Sending Request...' : 'Send Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookDetail;