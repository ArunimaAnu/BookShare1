import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaSearch, FaFilter, FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import './AdminDashboard.css';

const AdminBrowseBooks = () => {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGenre, setFilterGenre] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Genre options
  const genres = [
    'Fiction',
    'Non-fiction',
    'Mystery',
    'Romance',
    'Science Fiction',
    'Fantasy',
    'Biography',
    'History',
    'Self-Help',
    'Business',
    'Technology',
    'Other'
  ];

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get('http://localhost:5000/books?limit=100', {
        headers: {
          'x-auth-token': token
        }
      });

      if (response.data.status === 'success') {
        setBooks(response.data.data);
      } else {
        setError('Failed to load books');
      }
    } catch (err) {
      console.error('Error fetching books:', err);
      setError('Error loading books');
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBook = async (bookId) => {
    if (window.confirm('Are you sure you want to delete this book?')) {
      try {
        const token = localStorage.getItem('token');

        const response = await axios.delete(
          `http://localhost:5000/books/${bookId}`,
          {
            headers: {
              'x-auth-token': token
            }
          }
        );

        if (response.data.status === 'success') {
          // Remove book from list
          setBooks(books.filter(book => book._id !== bookId));
        } else {
          setError('Failed to delete book');
        }
      } catch (err) {
        console.error('Error deleting book:', err);
        setError('Error deleting book');
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = !filterGenre || book.genre === filterGenre;
    return matchesSearch && matchesGenre;
  });

  return (
    <div className="admin-dashboard-container">
      <div className="admin-sidebar">
        <div className="admin-logo">Admin Dashboard</div>
        <nav className="admin-nav">
          <button
            className="nav-item"
            onClick={() => navigate('/admin')}
          >
            Dashboard
          </button>
          <button
            className="nav-item"
            onClick={() => navigate('/admin/users')}
          >
            User Management
          </button>
          <button
            className="nav-item active"
            onClick={() => navigate('/admin/books')}
          >
            Book Management
          </button>
          <button
            className="nav-item"
            onClick={() => navigate('/admin/complaints')}
          >
            Complaints
          </button>
          <button
            className="nav-item logout"
            onClick={handleLogout}
          >
            Logout
          </button>
        </nav>
      </div>

      <div className="admin-content">
        <div className="admin-header">
          <h1>Browse Books</h1>
          <button
            onClick={() => navigate('/admin/books')}
            className="back-to-management"
          >
            Back to Book Management
          </button>
        </div>

        <div className="admin-main">
          {error && <div className="error-message">{error}</div>}

          <div className="browse-controls">
            <div className="search-box">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search by title or author..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            <button
              className="filter-toggle"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FaFilter /> Filters
            </button>

            {showFilters && (
              <div className="filter-section">
                <select
                  value={filterGenre}
                  onChange={(e) => setFilterGenre(e.target.value)}
                  className="genre-filter"
                >
                  <option value="">All Genres</option>
                  {genres.map(genre => (
                    <option key={genre} value={genre}>{genre}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {loading ? (
            <div className="loading">Loading books...</div>
          ) : (
            <div className="books-grid admin-books-grid">
              {filteredBooks.length === 0 ? (
                <div className="no-books">No books found matching your criteria.</div>
              ) : (
                filteredBooks.map(book => (
                  <div key={book._id} className="book-card admin-book-card">
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
                      <h3>{book.title}</h3>
                      <p className="author">by {book.author}</p>
                      <p className="genre">{book.genre}</p>
                      <div className="owner-info">
                        <span>Owner: {book.userId.name}</span>
                      </div>
                      <div className="status-badge">
                        Status: {book.status}
                      </div>                      <div className="book-actions">
                        <button
                          onClick={() => navigate(`/admin/books/${book._id}`)}
                          className="view-button"
                        >
                          <FaEye /> View
                        </button>
                        <button
                          onClick={() => navigate(`/edit-book/${book._id}`)}
                          className="edit-button"
                        >
                          <FaEdit /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteBook(book._id)}
                          className="delete-button"
                        >
                          <FaTrash /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminBrowseBooks;
