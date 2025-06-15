import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FaBell } from 'react-icons/fa';
import './NotificationBadge.css';

const NotificationBadge = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUnreadCount();
    
    // Set up polling to check for new notifications every minute
    const interval = setInterval(fetchUnreadCount, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      
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
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || error || unreadCount === 0) {
    // If loading, has error, or no unread notifications, just render the bell icon
    return (
      <Link to="/notifications" className="notification-badge-container">
        <FaBell className="notification-bell-icon" />
      </Link>
    );
  }

  return (
    <Link to="/notifications" className="notification-badge-container">
      <FaBell className="notification-bell-icon" />
      <span className="notification-count-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
    </Link>
  );
};

export default NotificationBadge;