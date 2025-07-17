import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FaBook, 
  FaExchangeAlt, 
  FaHeart, 
  FaSearch, 
  FaUser, 
  FaSignOutAlt, 
  FaPlus, 
  FaTrash, 
  FaBell,
  FaCalendarAlt,
  FaBars
} from 'react-icons/fa';
import './UserDashboard.css';

const LoadingSpinner = () => (
  <div className="loading-container">
    <div className="loading-spinner"></div>
  </div>
);

const BookCardSkeleton = () => (
  <div className="userdash-book-card">
    <div className="userdash-book-cover-wrap">
      <div className="loading-skeleton book-cover-skeleton" />
    </div>
    <div className="userdash-book-info">
      <div className="loading-skeleton" style={{ height: '24px', width: '90%', marginBottom: '8px' }} />
      <div className="loading-skeleton" style={{ height: '18px', width: '70%', marginBottom: '12px' }} />
      <div className="loading-skeleton" style={{ height: '16px', width: '50%', marginBottom: '8px' }} />
      <div className="loading-skeleton" style={{ height: '16px', width: '40%' }} />
    </div>
  </div>
);

const UserDashboard = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [error, setError] = useState(null);
  const [recentBooks, setRecentBooks] = useState([]);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [myBooks, setMyBooks] = useState([]);
  const [loadingMyBooks, setLoadingMyBooks] = useState(true);
  const [wishlist, setWishlist] = useState([]);
  const [loadingWishlist, setLoadingWishlist] = useState(true);
  const [removingWishlistItem, setRemovingWishlistItem] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [exchanges, setExchanges] = useState([]);
  const [loadingExchanges, setLoadingExchanges] = useState(true);

  // Handle delete book function - accessible throughout the component
  const handleDeleteBook = async (bookId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      // Call the delete book API endpoint
      const response = await axios.delete(`http://localhost:5000/books/${bookId}`, {
        headers: {
          'x-auth-token': token
        }
      });
      
      if (response.data.status === 'success') {
        // Remove the deleted book from the state
        setMyBooks(prevBooks => prevBooks.filter(book => book._id !== bookId));
        // Show success message (optional)
        alert('Book deleted successfully');
      } else {
        console.error('Failed to delete book:', response.data.message);
        alert(response.data.message || 'Failed to delete book');
      }
    } catch (err) {
      console.error('Error deleting book:', err);
      
      // Handle specific error cases
      if (err.response && err.response.data) {
        alert(err.response.data.message || 'Error deleting book');
      } else {
        alert('Error deleting book. Please try again.');
      }
    }
  };

  useEffect(() => {
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
        } else {
          setError('Failed to load user data');
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Error loading your profile');
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    const fetchRecentBooks = async () => {
      try {
        setLoadingBooks(true);
        const response = await axios.get('http://localhost:5000/books?limit=4');
        
        if (response.data.status === 'success') {
          setRecentBooks(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching recent books:', err);
      } finally {
        setLoadingBooks(false);
      }
    };

// Add this function to your UserDashboard.js component's useEffect
const fetchMyBooks = async () => {
  try {
    setLoadingMyBooks(true);
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Use the dedicated endpoint for fetching the current user's books
    const response = await axios.get('http://localhost:5000/my-books', {
      headers: {
        'x-auth-token': token
      }
    });
    
    if (response.data.status === 'success') {
      // Set the books state with the user's books
      setMyBooks(response.data.data);
      console.log('Fetched my books:', response.data.data.length);
    } else {
      console.error('Failed to fetch my books:', response.data.message);
      setError('Failed to load your books');
    }
  } catch (err) {
    console.error('Error fetching user books:', err);
    // Check for specific error types
    if (err.response) {
      // Server responded with a status code outside of 2xx range
      console.error('Server error:', err.response.status, err.response.data);
      if (err.response.status === 401) {
        // Unauthorized - token issue
        localStorage.removeItem('token');
        navigate('/login');
      }
    } else if (err.request) {
      // Request was made but no response was received
      console.error('No response received from server');
      setError('Server not responding. Please try again later.');
    } else {
      // Something happened in setting up the request
      console.error('Request setup error:', err.message);
      setError('Error setting up request');
    }
  } finally {
    setLoadingMyBooks(false);
  }
};

    const fetchWishlist = async () => {
      try {
        setLoadingWishlist(true);
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await axios.get('http://localhost:5000/wishlist', {
          headers: {
            'x-auth-token': token
          }
        });
        
        if (response.data.status === 'success') {
          setWishlist(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching wishlist:', err);
      } finally {
        setLoadingWishlist(false);
      }
    };

    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await axios.get('http://localhost:5000/notifications', {
          headers: {
            'x-auth-token': token
          }
        });
        
        if (response.data.status === 'success') {
          setNotifications(response.data.data);
          // Count unread notifications
          const unreadCount = response.data.data.filter(notif => !notif.isRead).length;
          setUnreadNotifications(unreadCount);
        }
      } catch (err) {
        console.error('Error fetching notifications:', err);
      }
    };

    const fetchExchanges = async () => {
      try {
        setLoadingExchanges(true);
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await axios.get('http://localhost:5000/exchanges', {
          headers: {
            'x-auth-token': token
          }
        });
        
        if (response.data.status === 'success') {
          setExchanges(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching exchanges:', err);
      } finally {
        setLoadingExchanges(false);
      }
    };

    fetchUserData();
    fetchRecentBooks();
    fetchMyBooks();
    fetchWishlist();
    fetchNotifications();
    fetchExchanges();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Function to handle removing an item from wishlist
  const handleRemoveFromWishlist = async (wishlistItemId) => {
    try {
      setRemovingWishlistItem(wishlistItemId);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.delete(`http://localhost:5000/wishlist/${wishlistItemId}`, {
        headers: {
          'x-auth-token': token
        }
      });

      if (response.data.status === 'success') {
        // Update the wishlist by removing the deleted item
        setWishlist(prevWishlist => prevWishlist.filter(item => item._id !== wishlistItemId));
      } else {
        setError('Failed to remove item from wishlist');
      }
    } catch (err) {
      console.error('Error removing from wishlist:', err);
      setError(err.response?.data?.message || 'Error removing from wishlist. Please try again.');
    } finally {
      setRemovingWishlistItem(null);
    }
  };

  // Function to render star ratings
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    // Add full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={`full-${i}`} className="userdash-star">★</span>);
    }
    
    // Add half star if needed
    if (hasHalfStar) {
      stars.push(<span key="half" className="userdash-star">★</span>);
    }
    
    // Add empty stars
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<span key={`empty-${i}`} className="userdash-star empty">☆</span>);
    }
    
    return stars;
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }
  return (
    <div className="dashboard-wrapper">
      <button 
        className="mobile-menu-toggle" 
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="Toggle menu"
      >
        <FaBars />
      </button>
      
      {/* Add backdrop for mobile menu */}
      <div 
        className={`mobile-menu-backdrop ${isMobileMenuOpen ? 'visible' : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
      />
      
      <div className="dashboard-container">
        <div className={`dashboard-sidebar ${isMobileMenuOpen ? 'mobile-visible' : ''}`}>
          <div className="sidebar-header">
            <h2>BookShare</h2>
          </div>
          <div className="user-profile">
            <div className="user-avatar">
              <FaUser />
            </div>
            <div className="user-info">
              <h3>{userData?.name}</h3>
              <p>{userData?.email}</p>
            </div>
          </div>
          <nav className="sidebar-menu">
            <ul>
              <li className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>
                <FaBook /> Dashboard
              </li>
              <li className={activeTab === 'my-books' ? 'active' : ''} onClick={() => setActiveTab('my-books')}>
                <FaBook /> My Books
              </li>
              <li className={activeTab === 'browse' ? 'active' : ''} onClick={() => navigate('/books')}>
                <FaSearch /> Browse Books
              </li>
              <li className={activeTab === 'wishlist' ? 'active' : ''} onClick={() => setActiveTab('wishlist')}>
                <FaHeart /> Wishlist
              </li>
              <li className={activeTab === 'exchanges' ? 'active' : ''} onClick={() => navigate('/exchanges')}>
                <FaExchangeAlt /> My Exchanges
              </li>
              <li className={activeTab === 'notifications' ? 'active' : ''} onClick={() => navigate('/notifications')}>
                <FaBell /> Notifications-
                {unreadNotifications > 0 && (
                  <span className="sidebar-notification-badge">{unreadNotifications}</span>
                )}
              </li>
              <li onClick={handleLogout}>
                <FaSignOutAlt /> Logout
              </li>
            </ul>
          </nav>
        </div>
        
        <div className="dashboard-main">
          <div className="dashboard-header">
            <div className="header-title">
              <h1>
                {activeTab === 'dashboard' && 'Dashboard'}
                {activeTab === 'my-books' && 'My Books'}
                {activeTab === 'wishlist' && 'My Wishlist'}
                {activeTab === 'exchanges' && 'My Exchanges'}
              </h1>
            </div>
            <div className="notifications" onClick={() => navigate('/notifications')}>
              <div className="notification-icon">
                <FaBell />
                {unreadNotifications > 0 && (
                  <span className="notification-badge">{unreadNotifications}</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="dashboard-content">
            {error && <div className="error-message">{error}</div>}
            
            {activeTab === 'dashboard' && (
              <>
                <div className="welcome-card">
                  <h2>Welcome, {userData?.name}!</h2>
                  <p>Share and discover books with our global community of readers.</p>
                  <div className="stats">
                    <div className="stat-item">
                      <h3>{myBooks.length}</h3>
                      <p>Books Shared</p>
                    </div>
                    <div className="stat-item">
                      <h3>{wishlist.length}</h3>
                      <p>Wishlist</p>
                    </div>
                    <div className="stat-item">
                      <h3>{exchanges.length}</h3>
                      <p>Exchanges</p>
                    </div>
                  </div>
                  <div className="action-buttons">
                    <button onClick={() => navigate('/add-book')} className="primary-button">
                      <FaPlus /> Add New Book
                    </button>
                    <button onClick={() => navigate('/books')} className="secondary-button">
                      <FaSearch /> Find Books
                    </button>
                  </div>
                </div>
                
                <div className="dashboard-section">
                  <div className="section-header">
                    <h2>Recent Books Added</h2>
                    <button onClick={() => navigate('/books')} className="view-all">
                      View All
                    </button>
                  </div>
                    {loadingBooks ? (
                    <div className="userdash-books-grid">
                      {[...Array(4)].map((_, index) => (
                        <BookCardSkeleton key={`skeleton-${index}`} />
                      ))}
                    </div>
                  ) : (<div className="userdash-books-grid">                  {recentBooks.map(book => (
                        <div 
                          key={book._id} 
                          className="userdash-book-card"
                          onClick={() => navigate(`/books/${book._id}`)}
                        >
                          <div className="userdash-book-cover-wrap">
                            <div className="userdash-book-loading-overlay">
                              <div className="userdash-book-loading-spinner"></div>
                            </div>
                            <img 
                              src={book.image || '/default-book-cover.jpg'} 
                              alt={book.title}
                              className="userdash-book-cover"
                              onLoad={(e) => {
                                e.target.classList.add('loaded');
                                e.target.closest('.userdash-book-cover-wrap').classList.add('loaded');
                              }}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/default-book-cover.jpg';
                                e.target.classList.add('error');
                                e.target.closest('.userdash-book-cover-wrap').classList.add('loaded');
                              }}
                            />
                          </div>
                          <div className="userdash-book-info">
                            <h4 className="userdash-book-title">{book.title}</h4>
                            <p className="userdash-book-author">{book.author}</p>
                            <div className="userdash-book-rating">
                              <div className="userdash-stars">
                                {renderStars(book.rating || 0)}
                              </div>
                            </div>
                <div className="userdash-book-location">{book.location}{book.area ? `, ${book.area}` : ''}</div>
                            <div className={`userdash-status-badge ${book.needsReturn ? 'return' : 'no-return'}`}>
                              {book.needsReturn ? 'Needs Return' : 'Gift'}
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {recentBooks.length === 0 && (
                        <div className="empty-state">
                          <p>No books available at the moment.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="dashboard-section">
                  <div className="section-header">
                    <h2>My Books</h2>
                    <button onClick={() => setActiveTab('my-books')} className="view-all">
                      View All
                    </button>
                  </div>
                    {loadingMyBooks ? (
                    <div className="userdash-books-grid">
                      {[...Array(4)].map((_, index) => (
                        <BookCardSkeleton key={`skeleton-${index}`} />
                      ))}
                    </div>
                  ) : (
                    <>
                      {myBooks.length === 0 ? (
                        <div className="empty-state">
                          <p>You haven't added any books yet.</p>
                          <button onClick={() => navigate('/add-book')} className="empty-action-button">
                            <FaPlus /> Add Your First Book
                          </button>
                        </div>
                      ) : (                        <div className="userdash-books-grid">
                          {myBooks.slice(0, 3).map(book => (
                            <div 
                              key={book._id} 
                              className="userdash-book-card"
                              onClick={() => navigate(`/books/${book._id}`)}
                            >
                              <div className="userdash-book-cover-wrap">
                                <img 
                                  src={book.image || '/default-book-cover.jpg'} 
                                  alt={book.title}
                                  className="userdash-book-cover"
                                  onLoad={(e) => e.target.classList.add('loaded')}
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = '/default-book-cover.jpg';
                                  }}
                                />
                              </div>
                              <div className="userdash-book-info">
                                <h4 className="userdash-book-title">{book.title}</h4>
                                <p className="userdash-book-author">{book.author}</p>
                                <div className="userdash-book-rating">
                                  <div className="userdash-stars">
                                    {renderStars(book.rating || 0)}
                                  </div>
                                </div>
                                <div className="userdash-book-location">{book.location}{book.area ? `, ${book.area}` : ''}</div>
                                <div className={`userdash-status-badge ${book.needsReturn ? 'return' : 'no-return'}`}>
                                  {book.needsReturn ? 'Needs Return' : 'Gift'}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
                
                {exchanges.length > 0 && (
                  <div className="dashboard-section">
                    <div className="section-header">
                      <h2>Recent Exchanges</h2>
                      <button onClick={() => navigate('/exchanges')} className="view-all">
                        View All
                      </button>
                    </div>
                    
                    {loadingExchanges ? (
                      <div className="loading-spinner"><div className="spinner small"></div></div>
                    ) : (                      <div className="userdash-books-grid">
                        {exchanges.slice(0, 3).map(exchange => (
                          <div 
                            key={exchange._id} 
                            className="userdash-book-card"
                            onClick={() => navigate(`/exchanges/${exchange._id}`)}
                          >
                            <div className="userdash-book-cover-wrap">
                              <img 
                                src={exchange.bookId.image || '/default-book-cover.jpg'} 
                                alt={exchange.bookId.title}
                                className="userdash-book-cover"
                                onLoad={(e) => e.target.classList.add('loaded')}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = '/default-book-cover.jpg';
                                }}
                              />
                            </div>
                            <div className="userdash-book-info">
                              <h4 className="userdash-book-title">{exchange.bookId.title}</h4>
                              <p className="userdash-book-author">{exchange.bookId.author}</p>
                              
                              <div className="exchange-details">
                                <div className={`userdash-status-badge status-${exchange.status}`}>
                                  {exchange.status.charAt(0).toUpperCase() + exchange.status.slice(1)}
                                </div>
                                
                                <div className="userdash-exchange-user">
                                  <span className="user-label">
                                    {exchange.ownerId._id === userData?._id ? 'Borrower:' : 'Owner:'}
                                  </span>
                                  <span className="user-name">
                                    {exchange.ownerId._id === userData?._id ? exchange.borrowerId.name : exchange.ownerId.name}
                                  </span>
                                </div>
                                
                                {exchange.borrowDate && (
                                  <div className="userdash-exchange-date">
                                    <FaCalendarAlt className="date-icon" />
                                    <span>Borrowed: {new Date(exchange.borrowDate).toLocaleDateString()}</span>
                                  </div>
                                )}
                                
                                {exchange.expectedReturnDate && exchange.status === 'borrowed' && (
                                  <div className="userdash-exchange-return-date">
                                    <FaCalendarAlt className="date-icon" />
                                    <span>Return by: {new Date(exchange.expectedReturnDate).toLocaleDateString()}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

{activeTab === 'my-books' && (
  <div className="my-books-page">
    <div className="page-actions">
      <button onClick={() => navigate('/add-book')} className="primary-button">
        <FaPlus /> Add New Book
      </button>
    </div>
    
    {error && <div className="error-message">{error}</div>}
      {loadingMyBooks ? (
      <div className="userdash-books-grid">
        {[...Array(8)].map((_, index) => (
          <BookCardSkeleton key={`skeleton-${index}`} />
        ))}
      </div>
    ) : (
      <>
        {myBooks.length === 0 ? (
          <div className="empty-state">
            <FaBook className="empty-icon" />
            <h3>You haven't added any books yet</h3>
            <p>Share your books with the community</p>
            <button onClick={() => navigate('/add-book')} className="empty-action-button">
              <FaPlus /> Add Your First Book
            </button>
          </div>
        ) : (
          <>
            <div className="section-info">
              <p>Showing {myBooks.length} book{myBooks.length !== 1 ? 's' : ''} that you've added</p>
            </div>
              <div className="userdash-books-grid">
              {myBooks.map(book => (
                <div 
                  key={book._id} 
                  className="userdash-book-card"
                  onClick={() => navigate(`/books/${book._id}`)}
                >
                  <div className="userdash-book-cover-wrap">
                    <div className="userdash-book-loading-overlay">
                      <div className="userdash-book-loading-spinner"></div>
                    </div>
                    <img 
                      src={book.image || '/default-book-cover.jpg'} 
                      alt={book.title}
                      className="userdash-book-cover"
                      onLoad={(e) => {
                        e.target.classList.add('loaded');
                        e.target.closest('.userdash-book-cover-wrap').classList.add('loaded');
                      }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/default-book-cover.jpg';
                        e.target.classList.add('error');
                        e.target.closest('.userdash-book-cover-wrap').classList.add('loaded');
                      }}
                    />                  </div>
                  <div className="userdash-book-info">
                    <h4 className="userdash-book-title">{book.title}</h4>
                    <p className="userdash-book-author">{book.author}</p>
                      <div className="userdash-book-rating">
                      <div className="userdash-stars">
                        {renderStars(book.rating || 0)}
                      </div>
                      <span className="review-count">
                        ({book.reviews ? book.reviews.length : 0})
                      </span>
                    </div>
                    
                    <div className="userdash-book-location">
                      {book.location}{book.area ? `, ${book.area}` : ''}
                    </div>
                    
                    <div className={`userdash-status-badge ${book.status ? book.status : ''} ${book.needsReturn ? 'return' : 'no-return'}`}>
                      {book.needsReturn ? 'Needs Return' : 'Gift'}
                    </div>
                    
                    <div className="book-actions">
                      <button 
                        className="edit-button" 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/edit-book/${book._id}`);
                        }}
                      >
                        Edit
                      </button>
                      {book.status === 'available' && (
                        <button 
                          className="delete-button" 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Are you sure you want to delete this book?')) {
                              handleDeleteBook(book._id);
                            }
                          }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </>
    )}
  </div>
)}         
          {activeTab === 'wishlist' && (
            <div className="wishlist-page">
              <div className="page-actions">
                <button onClick={() => navigate('/add-wishlist-item')} className="primary-button">
                  <FaPlus /> Add to Wishlist
                </button>
              </div>
              
              {loadingWishlist ? (
                <div className="loading-spinner"><div className="spinner"></div></div>
              ) : (
                <>
                  {wishlist.length === 0 ? (
                    <div className="empty-state">
                      <p>Your wishlist is empty.</p>
                      <button onClick={() => navigate('/add-wishlist-item')} className="empty-action-button">
                        <FaPlus /> Add Your First Wishlist Item
                      </button>
                    </div>
                  ) : (
                    <div className="wishlist-grid">
                      {wishlist.map(item => (
                        <div key={item._id} className="wishlist-item">
                          <div className="wishlist-content">
                            <h4>{item.title}</h4>
                            <p>{item.author}</p>
                          </div>
                          <div className="wishlist-actions">
                            <button 
                              className="remove-button" 
                              onClick={() => handleRemoveFromWishlist(item._id)}
                              disabled={removingWishlistItem === item._id}
                            >
                              {removingWishlistItem === item._id ? 'Removing...' : (
                                <>
                                  <FaTrash style={{ marginRight: '5px' }} /> Remove
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          
          {activeTab === 'exchanges' && (
            <div className="exchanges-page">
              <div className="page-actions">
                <button onClick={() => navigate('/books')} className="secondary-button">
                  <FaSearch /> Find Books
                </button>
              </div>
              
              {loadingExchanges ? (
                <div className="loading-spinner"><div className="spinner"></div></div>
              ) : (
                <>
                  {exchanges.length === 0 ? (
                    <div className="empty-state">
                      <p>You don't have any active exchanges.</p>
                      <button onClick={() => navigate('/books')} className="empty-action-button">
                        <FaSearch /> Find Books to Exchange
                      </button>
                    </div>
                  ) : (
                    <div className="exchanges-grid">
                      {exchanges.map(exchange => (
                        <div 
                          key={exchange._id} 
                          className="exchange-card"
                          onClick={() => navigate(`/exchanges/${exchange._id}`)}
                        >
                          <div className="exchange-thumbnail">
                            <img 
                              src={exchange.bookId.image || '/default-book-cover.jpg'} 
                              alt={exchange.bookId.title}
                              className="book-cover-image"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/default-book-cover.jpg';
                              }}
                            />
                          </div>
                          <div className="exchange-card-info">
                            <h4>{exchange.bookId.title}</h4>
                            <p className="book-author">{exchange.bookId.author}</p>
                            
                            <div className="exchange-details">
                              <span className={`status-badge status-${exchange.status}`}>
                                {exchange.status.charAt(0).toUpperCase() + exchange.status.slice(1)}
                              </span>
                              
                              <div className="exchange-user">
                                <span className="user-label">
                                  {exchange.ownerId._id === userData?._id ? 'Borrower:' : 'Owner:'}
                                </span>
                                <span className="user-name">
                                  {exchange.ownerId._id === userData?._id ? exchange.borrowerId.name : exchange.ownerId.name}
                                </span>
                              </div>
                              
                              {exchange.borrowDate && (
                                <div className="exchange-date">
                                  <FaCalendarAlt className="date-icon" />
                                  <span>Borrowed: {new Date(exchange.borrowDate).toLocaleDateString()}</span>
                                </div>
                              )}
                              
                              {exchange.expectedReturnDate && exchange.status === 'borrowed' && (
                                <div className="exchange-return-date">
                                  <FaCalendarAlt className="date-icon" />
                                  <span>Return by: {new Date(exchange.expectedReturnDate).toLocaleDateString()}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {exchanges.length > 3 && (
                        <div className="view-all-button">
                          <button onClick={() => navigate('/exchanges')} className="view-more-button">
                            View All Exchanges ({exchanges.length})
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>          )}
        </div>
      </div>
    </div>
    </div>
  );
};

export default UserDashboard;