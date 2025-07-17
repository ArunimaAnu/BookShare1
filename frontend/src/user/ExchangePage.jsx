import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FaExchangeAlt, 
  FaArrowLeft, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaHourglassHalf, 
  FaBook,
  FaInfoCircle,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaUser,
  FaSearch,
  FaStar
} from 'react-icons/fa';
import './ExchangePage.css';

const ExchangePage = () => {
  const navigate = useNavigate();
  
  const [exchanges, setExchanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    fetchExchanges();
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get('http://localhost:5000/user', {
        headers: {
          'x-auth-token': token
        }
      });

      if (response.data.status === 'success') {
        setUserData(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    }
  };

  const fetchExchanges = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      const response = await axios.get('http://localhost:5000/exchanges', {
        headers: {
          'x-auth-token': token
        }
      });
      
      if (response.data.status === 'success') {
        setExchanges(response.data.data);
      } else {
        setError('Failed to load exchanges');
      }
    } catch (err) {
      console.error('Error fetching exchanges:', err);
      setError('Error loading exchanges. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'accepted': return 'status-accepted';
      case 'borrowed': return 'status-borrowed';
      case 'returned': return 'status-returned';
      case 'completed': return 'status-completed';
      case 'rejected': return 'status-rejected';
      case 'cancelled': return 'status-cancelled';
      default: return '';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <FaHourglassHalf />;
      case 'accepted': return <FaCheckCircle />;
      case 'borrowed': return <FaBook />;
      case 'returned': return <FaCheckCircle />;
      case 'completed': return <FaCheckCircle />;
      case 'rejected': return <FaTimesCircle />;
      case 'cancelled': return <FaTimesCircle />;
      default: return <FaExchangeAlt />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Pending Approval';
      case 'accepted': return 'Accepted';
      case 'borrowed': return 'Borrowed';
      case 'returned': return 'Returned';
      case 'completed': return 'Completed';
      case 'rejected': return 'Rejected';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isOwner = (exchange) => {
    return userData && exchange.ownerId._id === userData._id;
  };

  const isBorrower = (exchange) => {
    return userData && exchange.borrowerId._id === userData._id;
  };

  const getExchangeRole = (exchange) => {
    if (isOwner(exchange)) return 'Owner';
    if (isBorrower(exchange)) return 'Borrower';
    return '';
  };

  const getOtherPartyName = (exchange) => {
    if (isOwner(exchange)) return exchange.borrowerId.name;
    if (isBorrower(exchange)) return exchange.ownerId.name;
    return '';
  };

  // New function to render stars for ratings
  const renderStars = (rating) => {
    if (!rating) return null;
    
    return (
      <div className="stars-container">
        {[1, 2, 3, 4, 5].map((star) => (
          <span 
            key={star} 
            className={star <= rating ? "star filled" : "star"}
          >
            <FaStar />
          </span>
        ))}
        <span className="rating-value">{rating.toFixed(1)}</span>
      </div>
    );
  };

  // New function to render ratings section
  const renderRatings = (exchange) => {
    // Only show ratings for completed exchanges that have ratings
    if (!['returned', 'completed'].includes(exchange.status) || (!exchange.ownerRating && !exchange.borrowerRating)) {
      return null;
    }
    
    return (
      <div className="exchange-ratings-summary">
        <div className="ratings-header">
          <FaStar className="ratings-icon" />
          <span className="ratings-label">Ratings:</span>
        </div>
        
        {exchange.ownerRating && (
          <div className="rating-item">
            <span className="rating-person">Owner:</span>
            {renderStars(exchange.ownerRating)}
          </div>
        )}
        
        {exchange.borrowerRating && (
          <div className="rating-item">
            <span className="rating-person">Borrower:</span>
            {renderStars(exchange.borrowerRating)}
          </div>
        )}
      </div>
    );
  };

  const getFilteredExchanges = () => {
    // First apply status filter
    let filtered = exchanges;
    
    if (filter !== 'all') {
      filtered = exchanges.filter(exchange => exchange.status === filter);
    }
    
    // Then apply search filter if there's a search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(exchange => 
        exchange.bookId.title.toLowerCase().includes(query) ||
        exchange.bookId.author.toLowerCase().includes(query) ||
        exchange.ownerId.name.toLowerCase().includes(query) ||
        exchange.borrowerId.name.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  };

  return (
    <div className="exchanges-container">
      <div className="exchanges-header">
        <button onClick={() => navigate('/user-dashboard')} className="back-button">
          <FaArrowLeft /> Back to Dashboard
        </button>
        <h1>My Exchanges</h1>
      </div>
      
      <div className="exchanges-content">
        <div className="exchanges-controls">
          <div className="search-filter-container">
            <div className="search-bar">
              <FaSearch />
              <input
                type="text"
                placeholder="Search by book title, author, or user..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="filter-controls">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="status-filter"
              >
                <option value="all">All Exchanges</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="borrowed">Borrowed</option>
                <option value="returned">Returned</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading exchanges...</p>
          </div>
        ) : getFilteredExchanges().length === 0 ? (
          <div className="no-exchanges">
            <FaExchangeAlt className="empty-icon" />
            <h3>No Exchanges Found</h3>
            {filter !== 'all' ? (
              <p>No exchanges with status "{filter}" were found.</p>
            ) : searchQuery ? (
              <p>No exchanges match your search criteria.</p>
            ) : (
              <p>You don't have any exchanges at the moment. Browse books to start exchanging!</p>
            )}
            <button onClick={() => navigate('/books')} className="browse-books-btn">
              Browse Books
            </button>
          </div>
        ) : (
          <div className="exchanges-list">
            {getFilteredExchanges().map(exchange => (
              <div key={exchange._id} className="exchange-item">
                <div className="exchange-summary" onClick={() => navigate(`/exchanges/${exchange._id}`)}>
                  <div className="exchange-book-info">
                    <div className="book-image">
                      <img 
                        src={exchange.bookId.image} 
                        alt={exchange.bookId.title}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/default-book-cover.jpg';
                        }}
                      />
                    </div>
                    <div className="book-details">
                      <h3>{exchange.bookId.title}</h3>
                      <p className="book-author">by {exchange.bookId.author}</p>
                    </div>
                  </div>
                  
                  <div className="exchange-details">
                    <div className="exchange-status">
                      <span className={`status-badge ${getStatusBadgeClass(exchange.status)}`}>
                        {getStatusIcon(exchange.status)} {getStatusText(exchange.status)}
                      </span>
                    </div>
                    
                    <div className="exchange-role">
                      <span className="role-label">Your role:</span>
                      <span className="role-value">{getExchangeRole(exchange)}</span>
                    </div>
                    
                    <div className="exchange-party">
                      <FaUser className="party-icon" />
                      <span className="party-label">
                        {isOwner(exchange) ? 'Borrower:' : 'Owner:'}
                      </span>
                      <span className="party-name">{getOtherPartyName(exchange)}</span>
                    </div>
                    
                    {exchange.exchangeMethod && (
                      <div className="exchange-method">
                        <FaMapMarkerAlt className="method-icon" />
                        <span className="method-value">
                          {exchange.exchangeMethod === 'in_person' ? 'In Person' : 
                           exchange.exchangeMethod === 'mail' ? 'By Mail' : 
                           exchange.exchangeMethod}
                        </span>
                      </div>
                    )}
                    
                    {exchange.cautionDeposit && exchange.cautionDeposit.amount > 250 && (
                      <div className="caution-deposit">
                        <FaMoneyBillWave className="deposit-icon" />
                        <span className="deposit-label">Deposit:</span>
                        <span className="deposit-value">Rs.{exchange.cautionDeposit.amount.toFixed(2)}</span>
                        <span className={`deposit-status ${exchange.cautionDeposit.paid ? 'paid' : 'unpaid'}`}>
                          {exchange.cautionDeposit.paid ? 
                            (exchange.cautionDeposit.refunded ? 'Refunded' : 'Paid') : 
                            'Unpaid'}
                        </span>
                      </div>
                    )}
                    
                    {exchange.borrowDate && (
                      <div className="date-info">
                        <FaCalendarAlt className="date-icon" />
                        <span className="date-label">Borrowed:</span>
                        <span className="date-value">{formatDate(exchange.borrowDate)}</span>
                      </div>
                    )}
                    
                    {exchange.expectedReturnDate && (
                      <div className="date-info return-date">
                        <FaCalendarAlt className="date-icon" />
                        <span className="date-label">Return by:</span>
                        <span className="date-value">{formatDate(exchange.expectedReturnDate)}</span>
                      </div>
                    )}
                    
                    {/* Add the ratings display */}
                    {renderRatings(exchange)}
                  </div>
                  
                  <div className="view-details">
                    <FaInfoCircle /> View Details
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExchangePage;