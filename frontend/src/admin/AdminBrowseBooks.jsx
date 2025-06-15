import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaSearch, FaFilter, FaEdit, FaTrash } from 'react-icons/fa';
import './AdminBrowseBooks.css';

const AdminBrowseBooks = () => {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGenre, setFilterGenre] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const genres = [
    'Fiction', 'Non-fiction', 'Mystery', 'Romance', 'Science Fiction',
    'Fantasy', 'Horror', 'Biography', 'History', 'Science', 'Technology'
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleDeleteBook = async (bookId) => {
    if (!window.confirm('Are you sure you want to delete this book?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/books/${bookId}`, {
        headers: { 'x-auth-token': token }
      });
      setBooks(books.filter(book => book._id !== bookId));
    } catch (err) {
      console.error('Error deleting book:', err);
      setError('Failed to delete book');
    }
  };

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await axios.get('http://localhost:5000/books?limit=100', {
          headers: { 'x-auth-token': token }
        });

        if (response.data.status === 'success') {
          setBooks(response.data.data);
        } else {
          setError('Failed to load books');
        }
      } catch (err) {
        console.error('Error fetching books:', err);
        setError('Error loading books');
        if (err.response?.status === 401 || err.response?.status === 403) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, [navigate]);

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = !filterGenre || book.genre === filterGenre;
    return matchesSearch && matchesGenre;
  });

  return (
    <div className="admin-dashboard-container">
      <div className="admindash-sidebar">
        <div className="admindash-logo">Admin Dashboard</div>
        <nav className="admindash-nav">
          <button
            className="admindash-nav-item"
            onClick={() => navigate('/admin')}
          >
            Dashboard
          </button>
          <button
            className="admindash-nav-item"
            onClick={() => navigate('/admin/users')}
          >
            User Management
          </button>
          <button
            className="admindash-nav-item active"
            onClick={() => navigate('/admin/books')}
          >
            Book Management
          </button>
          <button
            className="admindash-nav-item"
            onClick={() => navigate('/admin/complaints')}
          >
            Complaints
          </button>
          <button
            className="admindash-nav-item logout"
            onClick={handleLogout}
          >
            Logout
          </button>
        </nav>
      </div>

      <div className="admindash-content">
        <div className="admindash-header">
          <h1>Book Management</h1>
        </div>

        <div className="admindash-main">
          {error && <div className="admindash-error-message">{error}</div>}

          <div className="books-management-controls">
            <div className="search-filter-container">
              <div className="search-box">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Search by title or author..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <button
                className="filter-button"
                onClick={() => setShowFilters(!showFilters)}
              >
                <FaFilter /> Filter
              </button>

              {showFilters && (
                <div className="genre-filter">
                  <select
                    value={filterGenre}
                    onChange={(e) => setFilterGenre(e.target.value)}
                  >
                    <option value="">All Genres</option>
                    {genres.map(genre => (
                      <option key={genre} value={genre}>{genre}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {loading ? (
            <div className="loading">Loading books...</div>
          ) : (
            <div className="books-grid">
              {filteredBooks.map(book => (
                <div key={book._id} className="book-card">
                  <div className="book-cover">
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
                    <p className="author">{book.author}</p>
                    <p className="genre">{book.genre}</p>
                    <div className="book-rating">
                      {book.rating ? `${book.rating.toFixed(1)} ⭐` : 'No ratings'}
                    </div>
                    <div className="book-actions">
                      <button
                        className="view-button"
                        onClick={() => navigate(`/admin/books/${book._id}`)}
                      >
                        View Details
                      </button>
                      <button
                        className="edit-button"
                        onClick={() => navigate(`/edit-book/${book._id}`)}
                      >
                        <FaEdit /> Edit
                      </button>
                      <button
                        className="delete-button"
                        onClick={() => handleDeleteBook(book._id)}
                      >
                        <FaTrash /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminBrowseBooks;
