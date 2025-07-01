import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FaBell, 
  FaBook, 
  FaExchangeAlt, 
  FaStar, 
  FaCheck, 
  FaTrash, 
  FaRegBell, 
  FaCalendarAlt,
  FaArrowLeft,
  FaTimes,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaCalendarDay,
  FaSearch,
  FaFilter,
  FaFlag,
  FaEnvelope
} from 'react-icons/fa';
import './Notifications.css';

const Notifications = () => {
  const navigate = useNavigate();
  
  // State variables
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [currentNotification, setCurrentNotification] = useState(null);
  const [book, setBook] = useState(null); // Add this state for book details
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [exchangeDetails, setExchangeDetails] = useState({
    exchangeMethod: 'in_person',
    exchangeLocation: '',
    borrowDate: '',
    expectedReturnDate: '',
    cautionDeposit: {
      amount: 500,
      paid: false
    }
  });

  // Kerala locations
  const keralaLocations = [
    'Kozhikode Beach', 'Calicut University', 'SM Street Kozhikode', 'Lulu Mall Kozhikode',
    'Mananchira Square', 'Focus Mall Kozhikode', 'City Center Mall Kozhikode',
    'Marine Drive Kochi', 'Lulu Mall Kochi', 'Fort Kochi', 'MG Road Ernakulam',
    'Technopark Trivandrum', 'East Fort Trivandrum', 'Kovalam Beach',
    'Thrissur Round', 'Vadakkumnathan Temple', 'Kannur Town', 'Payyambalam Beach',
    'Kollam Beach', 'Palakkad Fort', 'Alappuzha Beach', 'Vembanad Lake',
    'Kottayam Railway Station', 'Kumarakom', 'Malappuram Town', 'Kalpetta',
    'Munnar', 'Thekkady', 'Vagamon'
  ];

  // Fetch notifications when component mounts
  useEffect(() => {
    fetchNotifications();
    
    // Auto-refresh every minute
    const intervalId = setInterval(fetchNotifications, 60000);
    return () => clearInterval(intervalId);
  }, []);

  // Filter notifications when search query or filter type changes
  useEffect(() => {
    if (notifications.length > 0) {
      let filtered = [...notifications];
      
      // Apply type filter
      if (filterType !== 'all') {
        filtered = filtered.filter(notification => notification.type === filterType);
      }
      
      // Apply search query filter
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(notification => 
          notification.message.toLowerCase().includes(query)
        );
      }
      
      setFilteredNotifications(filtered);
    }
  }, [notifications, searchQuery, filterType]);

  // Function to highlight search terms
  const highlightSearchTerm = (text, searchTerm) => {
    if (!searchTerm || searchTerm.trim() === '') return text;
    
    const parts = text.split(new RegExp(`(${searchTerm.trim()})`, 'gi'));
    return parts.map((part, index) => {
      if (part.toLowerCase() === searchTerm.toLowerCase()) {
        return <mark key={index}>{part}</mark>;
      }
      return part;
    });
  };

  // Function to get notification type display name
  const getNotificationTypeName = (type) => {
    switch (type) {
      case 'wishlist_match': return 'Wishlist Match';
      case 'borrow_request': return 'Borrow Request';
      case 'return_reminder': return 'Return Reminder';
      case 'book_return': return 'Book Return';
      case 'review': return 'Review';
      case 'complaint_submitted': return 'Complaint Submitted';
      case 'complaint_update': return 'Complaint Update';
      case 'complaint_resolved': return 'Complaint Resolved';
      case 'complaint_in_progress': return 'Complaint In Progress';
      default: return 'Notification';
    }
  };

  // Function to get notification icon
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'wishlist_match': return <FaBook className="notification-icon match" />;
      case 'borrow_request': return <FaExchangeAlt className="notification-icon request" />;
      case 'return_reminder': return <FaCalendarAlt className="notification-icon reminder" />;
      case 'book_return': return <FaExchangeAlt className="notification-icon return" />;
      case 'review': return <FaStar className="notification-icon review" />;
      case 'complaint_submitted': return <FaFlag className="notification-icon complaint" />;
      case 'complaint_update': return <FaEnvelope className="notification-icon update" />;
      case 'complaint_resolved': return <FaCheck className="notification-icon resolved" />;
      default: return <FaBell className="notification-icon" />;
    }
  };

  // Format date relative to now
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 60) {
      return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    } else {
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  // Helper function to extract exchange ID from actionLink
  const getExchangeIdFromLink = (actionLink) => {
    if (!actionLink) return null;
    
    // Assuming actionLink format is '/exchanges/{exchangeId}'
    const matches = actionLink.match(/\/exchanges\/([a-f\d]+)/i);
    return matches && matches[1] ? matches[1] : null;
  };

  // API calls
  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      const response = await axios.get('http://localhost:5000/notifications', {
        headers: { 'x-auth-token': token }
      });
      
      if (response.data.status === 'success') {
        // Process notifications to ensure they have exchangeId extracted from actionLink
        const processedNotifications = response.data.data.map(notification => {
          return {
            ...notification,
            exchangeId: getExchangeIdFromLink(notification.actionLink)
          };
        });
        
        setNotifications(processedNotifications);
        setFilteredNotifications(processedNotifications);
        setUnreadCount(processedNotifications.filter(notif => !notif.isRead).length);
      } else {
        setError('Failed to load notifications');
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Error loading notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      const response = await axios.put(`http://localhost:5000/notifications/${notificationId}/read`, {}, {
        headers: { 'x-auth-token': token }
      });
      
      if (response.data.status === 'success') {
        setNotifications(prevNotifications => 
          prevNotifications.map(notif => 
            notif._id === notificationId ? { ...notif, isRead: true } : notif
          )
        );
        setUnreadCount(prevCount => Math.max(0, prevCount - 1));
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      const response = await axios.put('http://localhost:5000/notifications/mark-all-read', {}, {
        headers: { 'x-auth-token': token }
      });
      
      if (response.data.status === 'success') {
        setNotifications(prevNotifications => 
          prevNotifications.map(notif => ({ ...notif, isRead: true }))
        );
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      const response = await axios.delete(`http://localhost:5000/notifications/${notificationId}`, {
        headers: { 'x-auth-token': token }
      });
      
      if (response.data.status === 'success') {
        // Remove the notification from state
        setNotifications(prevNotifications => 
          prevNotifications.filter(notif => notif._id !== notificationId)
        );
        
        // Update unread count if needed
        const deletedNotification = notifications.find(notif => notif._id === notificationId);
        if (deletedNotification && !deletedNotification.isRead) {
          setUnreadCount(prevCount => Math.max(0, prevCount - 1));
        }
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  // Event handlers
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleFilterChange = (e) => {
    setFilterType(e.target.value);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setFilterType('all');
  };

  const handleNotificationAction = (notification) => {
    // Mark notification as read when clicked
    if (!notification.isRead) {
      markAsRead(notification._id);
    }
    
    // Navigate to the action link
    if (notification.actionLink) {
      navigate(notification.actionLink);
    }
  };
  const handleExchangeDetailChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'cautionDepositAmount') {
      // Only update caution deposit if book needs return
      if (book?.needsReturn) {
        setExchangeDetails(prev => ({
          ...prev,
          cautionDeposit: {
            ...prev.cautionDeposit,
            amount: value
          }
        }));
      }
    } else if (name === 'exchangeLocation') {
      setExchangeDetails(prev => ({
        ...prev,
        [name]: value
      }));
      
      // Filter location suggestions based on input
      if (value.length > 0) {
        const filtered = keralaLocations.filter(location =>
          location.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredLocations(filtered.slice(0, 5)); // Show top 5 matches
        setShowLocationSuggestions(true);
      } else {
        setShowLocationSuggestions(false);
      }
    } else {
      setExchangeDetails(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const selectLocation = (location) => {
    setExchangeDetails(prev => ({
      ...prev,
      exchangeLocation: location
    }));
    setShowLocationSuggestions(false);
  };

  const openExchangeModal = async (notification) => {
    if (!notification || !notification.bookId) {
      console.error('Invalid notification data:', notification);
      return;
    }
    
    // Verify that we have an exchange ID
    if (!notification.exchangeId) {
      console.error('Notification missing exchangeId:', notification);
      setError('Exchange information is missing');
      return;
    }
    
    setCurrentNotification(notification);
    
    try {
      // Fetch book details to get needsReturn status
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get(`http://localhost:5000/books/${notification.bookId}`, {
        headers: { 'x-auth-token': token }
      });
      
      if (response.data.status === 'success') {
        const bookDetails = response.data.data;
        setBook(bookDetails);
        
        // Reset exchange details with appropriate caution deposit
        setExchangeDetails(prev => ({
          ...prev,
          cautionDeposit: {
            amount: bookDetails.needsReturn ? 500 : 0,
            paid: false
          }
        }));
        
        setShowExchangeModal(true);
      } else {
        console.error('Failed to fetch book details:', response.data);
      }
    } catch (err) {
      console.error('Error fetching book details:', err);
    }
  };  const acceptRequest = async (e) => {
    e.preventDefault(); // Prevent default form submission
    
    try {
      if (!currentNotification || !currentNotification.bookId) {
        console.error('Missing notification or book ID:', currentNotification);
        setError('Invalid request: Missing book information');
        return;
      }
      
      // Validate required fields
      if (!exchangeDetails.exchangeMethod) {
        setError('Please select an exchange method');
        return;
      }
      if (!exchangeDetails.exchangeLocation) {
        setError('Please enter an exchange location');
        return;
      }
      if (!exchangeDetails.borrowDate) {
        setError('Please select a borrow date');
        return;
      }
      if (book?.needsReturn && !exchangeDetails.expectedReturnDate) {
        setError('Please select an expected return date');
        return;
      }
      
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      // Ensure caution deposit is 0 for books that don't need return
      const modifiedExchangeDetails = {
        ...exchangeDetails,
        cautionDeposit: {
          ...exchangeDetails.cautionDeposit,
          amount: book?.needsReturn ? exchangeDetails.cautionDeposit.amount : 0
        }
      };

      // Find the exchange ID from the notification
      // Since the backend expects us to update the exchange status
      const exchangeId = currentNotification.exchangeId;
      
      if (!exchangeId) {
        setError('Exchange information is missing');
        return;
      }

      // Use the correct endpoint to respond to the exchange request
      const response = await axios.put(`http://localhost:5000/exchanges/${exchangeId}/respond`, {
        status: 'accepted',
        exchangeDetails: modifiedExchangeDetails
      }, {
        headers: { 'x-auth-token': token }
      });
      
      if (response.data.status === 'success') {
        // Mark notification as read
        markAsRead(currentNotification._id);
        
        // Close the modal
        setShowExchangeModal(false);
        
        // Navigate to the exchange details page if available
        if (response.data.data && response.data.data.exchangeId) {
          navigate(`/exchanges/${response.data.data.exchangeId}`);
        } else {
          // Otherwise refresh notifications
          fetchNotifications();
        }
      }
    } catch (err) {
      console.error('Error accepting request:', err);
      setError(err.response?.data?.message || 'Failed to accept request. Please try again.');
    }
  };

  const rejectRequest = async (notificationId, bookId, exchangeId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      if (!exchangeId) {
        console.error('Missing exchange ID for notification:', notificationId);
        setError('Exchange information is missing');
        return;
      }
      
      // Use the correct endpoint to respond to the exchange request
      const response = await axios.put(`http://localhost:5000/exchanges/${exchangeId}/respond`, {
        status: 'rejected'
      }, {
        headers: { 'x-auth-token': token }
      });
      
      if (response.data.status === 'success') {
        // Update the notification in state to mark it as read
        markAsRead(notificationId);
        // Refresh notifications to reflect the changes
        fetchNotifications();
      }
    } catch (err) {
      console.error('Error rejecting request:', err);
      setError(err.response?.data?.message || 'Failed to reject request. Please try again.');
    }
  };

  // Render component
  return (
    <div className="notifications-container">
      <div className="notifications-header">
        <button onClick={() => navigate('/user-dashboard')} className="notify-back-button">
          <FaArrowLeft /> Back to Dashboard
        </button>
        <h1>Notifications</h1>
      </div>
      
      <div className="notifications-content">
        <div className="notifications-controls">
          <div className="notification-count">
            <FaBell /> {unreadCount} unread notifications
          </div>
          
          <div className="controls-right">
            {unreadCount > 0 && (
              <button 
                className="mark-all-read-btn"
                onClick={markAllAsRead}
                disabled={loading}
              >
                <FaCheck /> Mark all as read
              </button>
            )}
          </div>
        </div>
        
        {/* Search and Filter Bar */}
        <div className="search-filter-bar">
          <div className="search-container">
            <FaSearch className="search-icon" />
            <input 
              type="text"
              className="search-input"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
            {searchQuery && (
              <button 
                className="clear-search-btn"
                onClick={clearSearch}
              >
                <FaTimes />
              </button>
            )}
          </div>
          
          <div className="filter-container">
            <FaFilter className="filter-icon" />
            <select 
              className="filter-select"
              value={filterType}
              onChange={handleFilterChange}
            >
              <option value="all">All Types</option>
              <option value="borrow_request">Borrow Requests</option>
              <option value="book_return">Book Returns</option>
              <option value="review">Reviews</option>
              <option value="wishlist_match">Wishlist Matches</option>
              <option value="return_reminder">Return Reminders</option>
              <option value="complaint_submitted">Complaint Submitted</option>
              <option value="complaint_update">Complaint Updates</option>
              <option value="complaint_resolved">Complaint Resolved</option>
            </select>
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
            <p>Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="no-notifications">
            {notifications.length === 0 ? (
              <>
                <FaRegBell className="empty-icon" />
                <h3>No Notifications</h3>
                <p>You don't have any notifications at the moment.</p>
              </>
            ) : (
              <>
                <FaSearch className="empty-icon" />
                <h3>No Results Found</h3>
                <p>No notifications match your search criteria.</p>
                <button className="clear-filters-btn" onClick={clearSearch}>
                  Clear Filters
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="notifications-list">
            {filteredNotifications.map(notification => (
              <div 
                key={notification._id} 
                className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
              >
                <div className="notification-icon-container">
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div 
                  className="notification-content"
                  onClick={() => handleNotificationAction(notification)}
                >
                  <div className="notification-message">
                    {highlightSearchTerm(notification.message, searchQuery)}
                  </div>
                  <div className="notification-meta">
                    <span className="notification-time">
                      {formatDate(notification.createdAt)}
                    </span>
                    <span className={`notification-type-badge type-badge-${notification.type}`}>
                      {getNotificationTypeName(notification.type)}
                    </span>
                  </div>
                </div>
                
                <div className="notification-actions">
                  {notification.type === 'borrow_request' && !notification.isRead && (
                    <>
                      <button 
                        className="accept-btn" 
                        onClick={(e) => {
                          e.stopPropagation();
                          openExchangeModal(notification);
                        }}
                        title="Accept request"
                      >
                        <FaCheck />
                      </button>
                      <button 
                        className="reject-btn" 
                        onClick={(e) => {
                          e.stopPropagation();
                          rejectRequest(notification._id, notification.bookId, notification.exchangeId);
                        }}
                        title="Reject request"
                      >
                        <FaTimes />
                      </button>
                    </>
                  )}
                  
                  {!notification.isRead && notification.type !== 'borrow_request' && (
                    <button 
                      className="read-btn" 
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification._id);
                      }}
                      title="Mark as read"
                    >
                      <FaCheck />
                    </button>
                  )}
                  
                  <button 
                    className="delete-btn" 
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification._id);
                    }}
                    title="Delete notification"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Exchange Details Modal */}
      {showExchangeModal && (
        <div className="modal-overlay">
          <div className="exchange-modal">
            <div className="modal-header">
              <h2>Accept Book Request</h2>
              <button 
                className="close-modal-btn"
                onClick={() => setShowExchangeModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">              <p className="modal-info">
                Please provide details for this book exchange. This information will help organize the exchange process.
              </p>
                <form className="exchange-form" onSubmit={acceptRequest}>
                {error && <div className="error-message">{error}</div>}
                <div className="form-group">
                  <label>
                    <FaExchangeAlt /> Exchange Method:
                    <select 
                      name="exchangeMethod"
                      value={exchangeDetails.exchangeMethod}
                      onChange={handleExchangeDetailChange}
                    >
                      <option value="in_person">In Person</option>
                      <option value="mail">By Mail</option>
                      <option value="other">Other</option>
                    </select>
                  </label>
                </div>
                
                <div className="form-group location-group">
                  <label>
                    <FaMapMarkerAlt /> Exchange Location:
                    <div className="location-input-container">
                      <input 
                        type="text"
                        name="exchangeLocation"
                        value={exchangeDetails.exchangeLocation}
                        onChange={handleExchangeDetailChange}
                        placeholder="Type to search Kerala locations..."
                        onFocus={() => {
                          if (exchangeDetails.exchangeLocation.length > 0) {
                            setShowLocationSuggestions(true);
                          }
                        }}
                        onBlur={() => {
                          // Delay hiding suggestions to allow clicks
                          setTimeout(() => setShowLocationSuggestions(false), 200);
                        }}
                      />
                      {showLocationSuggestions && filteredLocations.length > 0 && (
                        <div className="location-suggestions">
                          {filteredLocations.map((location, index) => (
                            <div 
                              key={index}
                              className="location-suggestion"
                              onClick={() => selectLocation(location)}
                            >
                              <FaMapMarkerAlt /> {location}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </label>
                </div>                {/* Only show the caution deposit field if the book needs to be returned */}
                {book?.needsReturn && (
                  <div className="form-group">
                    <label>
                      <FaMoneyBillWave /> Caution Deposit:
                      <div className="input-with-prefix">
                        <span className="input-prefix">₹</span>
                        <input 
                          type="number"
                          name="cautionDepositAmount"
                          value={exchangeDetails.cautionDeposit.amount}
                          onChange={handleExchangeDetailChange}
                          min="0"
                          step="1"
                        />
                      </div>
                    </label>
                  </div>
                )}
                
                <div className="form-group">
                  <label>
                    <FaCalendarDay /> Borrow Date:
                    <input 
                      type="date"
                      name="borrowDate"
                      value={exchangeDetails.borrowDate}
                      onChange={handleExchangeDetailChange}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </label>
                </div>
                
                <div className="form-group">
                  <label>
                    <FaCalendarAlt /> Expected Return Date:
                    <input 
                      type="date"
                      name="expectedReturnDate"
                      value={exchangeDetails.expectedReturnDate}
                      onChange={handleExchangeDetailChange}
                      min={exchangeDetails.borrowDate}
                    />
                  </label>
                </div>                <div className="modal-footer">
                  <button 
                    type="button"
                    className="cancel-btn"
                    onClick={() => setShowExchangeModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="confirm-btn"
                  >
                    Accept Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;