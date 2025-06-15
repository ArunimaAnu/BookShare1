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
        <div className="admin-content">
          <div className="loading">Loading book details...</div>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="admin-dashboard-container">
        <div className="admin-content">
          <div className="error-message">Book not found</div>
          <button onClick={() => navigate('/admin/books')} className="back-button">
            <FaArrowLeft /> Back to Books
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-container">
      <div className="admin-sidebar">
        <div className="admin-logo">Admin Dashboard</div>
        <nav className="admin-nav">
          <button className="nav-item" onClick={() => navigate('/admin')}>
            Dashboard
          </button>
          <button className="nav-item" onClick={() => navigate('/admin/users')}>
            User Management
          </button>
          <button className="nav-item active" onClick={() => navigate('/admin/books')}>
            Book Management
          </button>
          <button className="nav-item" onClick={() => navigate('/admin/complaints')}>
            Complaints
          </button>
        </nav>
      </div>

      <div className="admin-content">
        <div className="book-detail-header">
          <button onClick={() => navigate('/admin/books')} className="back-button">
            <FaArrowLeft /> Back to Books
          </button>
          <div className="header-actions">
            <button onClick={() => navigate(`/edit-book/${id}`)} className="edit-button">
              <FaEdit /> Edit Book
            </button>
            <button onClick={handleDeleteBook} className="delete-button">
              <FaTrash /> Delete Book
            </button>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="book-detail-content">
          <div className="book-detail-grid">
            <div className="book-image">
              <img 
                src={book.image || '/default-book-cover.jpg'} 
                alt={book.title}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/default-book-cover.jpg';
                }}
              />
            </div>

            <div className="book-info">
              <h1 className="book-title">{book.title}</h1>
              <p className="book-author">by {book.author}</p>

              <div className="book-meta">
                <div className="meta-item">
                  <FaUser />
                  <span>Owner: {book.userId.name}</span>
                </div>

                <div className="meta-item">
                  <FaTags />
                  <span>Genre: {book.genre}</span>
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

              <div className="book-rating">
                <div className="stars">
                  {renderStars(book.rating || 0)}
                </div>
                <span className="rating-count">
                  ({book.reviews ? book.reviews.length : 0} reviews)
                </span>
              </div>

              {book.description && (
                <div className="book-description">
                  <h3>Description</h3>
                  <p>{book.description}</p>
                </div>
              )}

              <div className="book-status">
                <h3>Status</h3>
                <div className="status-badge">{book.status}</div>
                <div className="return-policy">
                  {book.needsReturn ? 'Requires Return' : 'No Return Required'}
                </div>
              </div>

              {book.reviews && book.reviews.length > 0 && (
                <div className="book-reviews">
                  <h3>Reviews</h3>
                  <div className="reviews-list">
                    {book.reviews.map((review, index) => (
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
                        <div className="review-content">{review.comment}</div>
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
  );
};

export default AdminBookDetail;
