import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeft, FaStar, FaEdit, FaTrash, FaUser, FaMapMarkerAlt, FaCalendarAlt, FaTags } from 'react-icons/fa';
import './AdminDashboard.css';

const AdminBookDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBookDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
        
        const response = await axios.get(`http://localhost:5000/books/${id}`, {
          headers: {
            'x-auth-token': token
          }
        });
        
        if (response.data.status === 'success') {
          setBook(response.data.data);
        } else {
          setError('Failed to load book details');
        }
      } catch (err) {
        console.error('Error fetching book:', err);
        setError(err.response?.data?.message || 'Error loading book details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBookDetails();
  }, [id, navigate]);

  const handleDeleteBook = async () => {
    if (window.confirm('Are you sure you want to delete this book?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.delete(
          `http://localhost:5000/books/${id}`,
          {
            headers: {
              'x-auth-token': token
            }
          }
        );

        if (response.data.status === 'success') {
          navigate('/admin/books');
        } else {
          setError('Failed to delete book');
        }
      } catch (err) {
        console.error('Error deleting book:', err);
        setError('Error deleting book');
      }
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={`star-${i}`} className="star filled" />);
    }
    
    if (hasHalfStar) {
      stars.push(<FaStar key="star-half" className="star half" />);
    }
    
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<FaStar key={`star-empty-${i}`} className="star" />);
    }
    
    return stars;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="admin-dashboard-container">
        <div className="admindash-sidebar">
          <div className="admindash-logo">Admin Dashboard</div>
          <nav className="admindash-nav">
            <button className="admindash-nav-item" onClick={() => navigate('/admin')}>
              Dashboard
            </button>
            <button className="admindash-nav-item" onClick={() => navigate('/admin/users')}>
              User Management
            </button>
            <button className="admindash-nav-item active" onClick={() => navigate('/admin/books')}>
              Book Management
            </button>
            <button className="admindash-nav-item" onClick={() => navigate('/admin/complaints')}>
              Complaints
            </button>
            <button className="admindash-nav-item logout" onClick={() => navigate('/login')}>
              Logout
            </button>
          </nav>
        </div>
        <div className="admindash-content">
          <div className="admindash-header">
            <h1>Book Details</h1>
          </div>
          <div className="admindash-main">
            <div className="loading">Loading book details...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="admin-dashboard-container">
        <div className="admindash-sidebar">
          <div className="admindash-logo">Admin Dashboard</div>
          <nav className="admindash-nav">
            <button className="admindash-nav-item" onClick={() => navigate('/admin')}>
              Dashboard
            </button>
            <button className="admindash-nav-item" onClick={() => navigate('/admin/users')}>
              User Management
            </button>
            <button className="admindash-nav-item active" onClick={() => navigate('/admin/books')}>
              Book Management
            </button>
            <button className="admindash-nav-item" onClick={() => navigate('/admin/complaints')}>
              Complaints
            </button>
            <button className="admindash-nav-item logout" onClick={() => navigate('/login')}>
              Logout
            </button>
          </nav>
        </div>
        <div className="admindash-content">
          <div className="admindash-header">
            <h1>Book Details</h1>
          </div>
          <div className="admindash-main">
            <div className="error-message">Book not found</div>
            <button onClick={() => navigate('/admin/books')} className="back-button">
              <FaArrowLeft /> Back to Books
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-container">
      <div className="admindash-sidebar">
        <div className="admindash-logo">Admin Dashboard</div>
        <nav className="admindash-nav">
          <button className="admindash-nav-item" onClick={() => navigate('/admin')}>
            Dashboard
          </button>
          <button className="admindash-nav-item" onClick={() => navigate('/admin/users')}>
            User Management
          </button>
          <button className="admindash-nav-item active" onClick={() => navigate('/admin/books')}>
            Book Management
          </button>
          <button className="admindash-nav-item" onClick={() => navigate('/admin/complaints')}>
            Complaints
          </button>
          <button className="admindash-nav-item logout" onClick={() => navigate('/login')}>
            Logout
          </button>
        </nav>
      </div>

      <div className="admindash-content">
        <div className="admindash-header">
          <h1>Book Details</h1>
        </div>

        <div className="admindash-main">
          <div className="admindash-section">
            <div className="book-actions">
              <button onClick={() => navigate('/admin/books')} className="back-button">
                <FaArrowLeft /> Back to Books
              </button>
              <div className="action-buttons">
                {/* <button onClick={() => navigate(`/edit-book/${id}`)} className="admindash-action-button">
                  <FaEdit /> Edit Book
                </button> */}
                <button onClick={handleDeleteBook} className="admindash-action-button" style={{ backgroundColor: '#ef4444' }}>
                  <FaTrash /> Delete Book
                </button>
              </div>
            </div>

            {error && <div className="admindash-error-message">{error}</div>}

            <div className="admindash-book-detail">
              <div className="bookss-cover">
                <img 
                  src={book.image || '/default-bookss-cover.jpg'} 
                  alt={book.title}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/default-bookss-cover.jpg';
                  }}
                />
              </div>

              <div className="book-content">
                <h2 className="book-title">{book.title}</h2>
                <p className="book-author">by {book.author}</p>

                <div className="book-info-grid">
                  <div className="info-item">
                    <FaUser className="info-icon" />
                    <div>
                      <label>Owner</label>
                      <span>{book.userId.name}</span>
                    </div>
                  </div>

                  <div className="info-item">
                    <FaTags className="info-icon" />
                    <div>
                      <label>Genre</label>
                      <span>{book.genre}</span>
                    </div>
                  </div>

                  <div className="info-item">
                    <FaMapMarkerAlt className="info-icon" />
                    <div>
                      <label>Location</label>
                      <span>{book.location}{book.area ? `, ${book.area}` : ''}</span>
                    </div>
                  </div>

                  <div className="info-item">
                    <FaCalendarAlt className="info-icon" />
                    <div>
                      <label>Added</label>
                      <span>{formatDate(book.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="book-rating-section">
                  <label>Rating</label>
                  <div className="rating-display">
                    <div className="stars">
                      {renderStars(book.rating || 0)}
                    </div>
                    <span className="review-count">
                      ({book.reviews ? book.reviews.length : 0} reviews)
                    </span>
                  </div>
                </div>

                {book.description && (
                  <div className="book-description-section">
                    <label>Description</label>
                    <p className="description-text">{book.description}</p>
                  </div>
                )}

                <div className="book-status-section">
                  <div className="status-info">
                    <label>Status</label>
                    <div className="admindash-status-badge">{book.status}</div>
                  </div>
                  <div className="return-info">
                    <label>Return Policy</label>
                    <span>{book.needsReturn ? 'Requires Return' : 'No Return Required'}</span>
                  </div>
                </div>

                {book.reviews && book.reviews.length > 0 && (
                  <div className="book-reviews-section">
                    <h3>Reviews</h3>
                    <div className="reviews-grid">
                      {book.reviews.map((review, index) => (
                        <div key={index} className="review-card">
                          <div className="review-header">
                            <div className="reviewer-details">
                              <span className="reviewer-name">{review.userId?.name || 'Anonymous'}</span>
                              <span className="review-date">{formatDate(review.createdAt)}</span>
                            </div>
                            <div className="review-stars">
                              {renderStars(review.rating)}
                            </div>
                          </div>
                          <p className="review-text">{review.comment}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminBookDetail;
