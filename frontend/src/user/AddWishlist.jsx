import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeft, FaHeart, FaSearch } from 'react-icons/fa';
import './AddWishlist.css';

const AddWishlist = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: '',
    author: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      const response = await axios.post(
        'http://localhost:5000/wishlist',
        formData,
        {
          headers: {
            'x-auth-token': token
          }
        }
      );
      
      if (response.data.status === 'success') {
        setSuccessMessage('Book added to wishlist successfully!');
        setFormData({
          title: '',
          author: ''
        });
        
        // Also check if there are matching books available
        searchBooks();
      } else {
        setError(response.data.message || 'Failed to add to wishlist');
      }
    } catch (err) {
      console.error('Error adding to wishlist:', err);
      setError(err.response?.data?.message || 'Error adding to wishlist. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const searchBooks = async () => {
    if (!formData.title && !formData.author) {
      return;
    }
    
    setSearching(true);
    setSearchResults([]);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      // Build query parameters
      const params = new URLSearchParams();
      if (formData.title) params.append('title', formData.title);
      if (formData.author) params.append('author', formData.author);
      
      const response = await axios.get(
        `http://localhost:5000/books?${params.toString()}`,
        {
          headers: {
            'x-auth-token': token
          }
        }
      );
      
      if (response.data.status === 'success') {
        setSearchResults(response.data.data);
      }
    } catch (err) {
      console.error('Error searching books:', err);
    } finally {
      setSearching(false);
    }
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
  
  return (
    <div className="add-wishlist-container">
      <div className="add-wishlist-header">
        <button onClick={() => navigate('/user-dashboard')} className="back-button">
          <FaArrowLeft /> Back to Dashboard
        </button>
        <h1>Add to Wishlist</h1>
      </div>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="success-message">
          {successMessage}
        </div>
      )}
      
      <div className="add-wishlist-content">
        <div className="wishlist-form-container">
          <form onSubmit={handleSubmit} className="wishlist-form">
            <div className="form-header">
              <FaHeart />
              <h2>Add a Book to Your Wishlist</h2>
            </div>
            
            <p className="form-description">
              Add books to your wishlist and receive notifications when they become available for borrowing.
            </p>
            
            <div className="form-group">
              <label htmlFor="title">Book Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="Enter book title"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="author">Author *</label>
              <input
                type="text"
                id="author"
                name="author"
                value={formData.author}
                onChange={handleChange}
                required
                placeholder="Enter author name"
              />
            </div>
            
            <div className="form-actions">
              {/* <button
                type="button"
                onClick={searchBooks}
                className="search-button"
                disabled={loading || searching}
              >
                <FaSearch /> {searching ? 'Searching...' : 'Check Availability'}
              </button> */}
              
              <button
                type="submit"
                className="submit-button"
                disabled={loading}
              >
                <FaHeart /> {loading ? 'Adding...' : 'Add to Wishlist'}
              </button>
            </div>
          </form>
        </div>
        
        {searchResults.length > 0 && (
          <div className="search-results">
            <h3>Available Books Matching Your Search</h3>
            <div className="results-grid">
              {searchResults.map(book => (
                <div 
                  key={book._id} 
                  className="book-card"
                  onClick={() => navigate(`/books/${book._id}`)}
                >
                  <div className="book-thumbnail">
                    <img src={book.image || '/default-book-cover.jpg'} alt={book.title} />
                  </div>
                  <div className="book-card-info">
                    <h4>{book.title}</h4>
                    <p className="book-author">{book.author}</p>
                    <div className="book-rating">
                      <div className="stars">
                        {renderStars(book.rating || 0)}
                      </div>
                      <span>({book.reviews?.length || 0})</span>
                    </div>
                    <p className="book-location">{book.location}{book.area ? `, ${book.area}` : ''}</p>
                    <div className="book-owner">
                      Added by: {book.userId?.name || 'Unknown'}
                    </div>
                    <div className="book-status">
                      <span className={`status-badge ${book.needsReturn ? 'return' : 'no-return'}`}>
                        {book.needsReturn ? 'Needs Return' : 'Gift'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="results-footer">
              <p>Click on a book to view details and request to borrow it.</p>
            </div>
          </div>
        )}
        
        {searchResults.length === 0 && searching && (
          <div className="search-loading">
            <div className="spinner"></div>
            <p>Searching for matching books...</p>
          </div>
        )}
        
        {searchResults.length === 0 && !searching && formData.title && formData.author && (
          <div className="no-results">
            <h3>No matching books available</h3>
            <p>
              We couldn't find any available books matching your search criteria. Add this book to your wishlist and get notified when it becomes available.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddWishlist;