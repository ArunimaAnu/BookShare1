import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FaBell, 
  FaBook, 
  FaExchangeAlt, 
  FaStar, 
  FaCheck, 
  FaTrash,
  FaAngleRight,
  FaCalendarAlt 
} from 'react-icons/fa';
import './NotificationDropdown.css';

const NotificationDropdown = () => {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Add event listener to close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    
    // Fetch unread count on mount
    fetchUnreadCount();
    
    // Set up polling to check for new notifications
    const interval = setInterval(fetchUnreadCount, 60000);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      clearInterval(interval);
    };
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await axios.get('http://localhost:5000/notifications/unread-count', {
        headers: {
          'x-auth-token': token
        }
      });
      
      if (response.data.status === 'success') {
        setUnreadCount(response.data.data.count);
      }
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  };

  const fetchNotifications = async () => {
    if (loading) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await axios.get('http://localhost:5000/notifications', {
        headers: {
          'x-auth-token': token
        }
      });
      
      if (response.data.status === 'success') {
        // Limit to 5 most recent notifications for the dropdown
        setNotifications(response.data.data.slice(0, 5));
      } else {
        setError('Failed to load notifications');
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Error loading notifications');
    } finally {
      setLoading(false);
    }
  };

  const toggleDropdown = () => {
    const shouldOpen = !isOpen;
    setIsOpen(shouldOpen);
    
    if (shouldOpen) {
      fetchNotifications();
    }
  };

  const markAsRead = async (notificationId, e) => {
    e.stopPropagation();
    
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await axios.put(`http://localhost:5000/notifications/${notificationId}/read`, {}, {
        headers: {
          'x-auth-token': token
        }
      });
      
      if (response.data.status === 'success') {
        // Update the notification in state
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

  const markAllAsRead = async (e) => {
    e.stopPropagation();
    
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await axios.put('http://localhost:5000/notifications/mark-all-read', {}, {
        headers: {
          'x-auth-token': token
        }
      });
      
      if (response.data.status === 'success') {
        // Update all notifications in state
        setNotifications(prevNotifications => 
          prevNotifications.map(notif => ({ ...notif, isRead: true }))
        );
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const handleNotificationClick = (notification) => {
    // Mark as read when clicked
    if (!notification.isRead) {
      const token = localStorage.getItem('token');
      if (token) {
        axios.put(`http://localhost:5000/notifications/${notification._id}/read`, {}, {
          headers: {
            'x-auth-token': token
          }
        }).then(() => {
          setUnreadCount(prevCount => Math.max(0, prevCount - 1));
        }).catch(err => {
          console.error('Error marking notification as read:', err);
        });
      }
    }
    
    // Close dropdown
    setIsOpen(false);
    
    // Navigate to the action link
    if (notification.actionLink) {
      navigate(notification.actionLink);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'wishlist_match':
        return <FaBook className="notification-icon match" />;
      case 'borrow_request':
        return <FaExchangeAlt className="notification-icon request" />;
      case 'return_reminder':
        return <FaCalendarAlt className="notification-icon reminder" />;
      case 'book_return':
        return <FaExchangeAlt className="notification-icon return" />;
      case 'review':
        return <FaStar className="notification-icon review" />;
      default:
        return <FaBell className="notification-icon" />;
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="notification-dropdown-container" ref={dropdownRef}>
      <button 
        className={`notification-dropdown-trigger ${unreadCount > 0 ? 'has-unread' : ''}`}
        onClick={toggleDropdown}
      >
        <FaBell />
        {unreadCount > 0 && (
          <span className="notification-dropdown-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      
      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button className="mark-all-read" onClick={markAllAsRead}>
                <FaCheck /> Mark all read
              </button>
            )}
          </div>
          
          <div className="notification-dropdown-content">
            {loading ? (
              <div className="dropdown-loading">
                <div className="dropdown-spinner"></div>
                <p>Loading...</p>
              </div>
            ) : error ? (
              <div className="dropdown-error">
                <p>{error}</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="dropdown-empty">
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div 
                  key={notification._id} 
                  className={`dropdown-notification ${!notification.isRead ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="dropdown-notification-icon">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="dropdown-notification-content">
                    <p className="dropdown-notification-message">{notification.message}</p>
                    <span className="dropdown-notification-time">{formatTime(notification.createdAt)}</span>
                  </div>
                  {!notification.isRead && (
                    <button 
                      className="dropdown-notification-mark-read"
                      onClick={(e) => markAsRead(notification._id, e)}
                      title="Mark as read"
                    >
                      <FaCheck />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
          
          <div className="notification-dropdown-footer">
            <button 
              className="view-all-btn"
              onClick={() => {
                setIsOpen(false);
                navigate('/notifications');
              }}
            >
              View all notifications <FaAngleRight />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;