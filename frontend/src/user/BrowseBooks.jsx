import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaSearch, FaFilter, FaBook, FaStar, FaArrowLeft, FaArrowRight, FaTags } from 'react-icons/fa';
import './BrowseBooks.css';

const BrowseBooks = () => {
  const navigate = useNavigate();
  
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Search and filter state
  const [searchTitle, setSearchTitle] = useState('');
  const [searchAuthor, setSearchAuthor] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [searchGenre, setSearchGenre] = useState('');
  const [searchLanguage, setSearchLanguage] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBooks, setTotalBooks] = useState(0);
  
  // Genre options
  const genres = [
    'Fiction',
    'Non-Fiction',
    'Mystery',
    'Romance',
    'Science Fiction',
    'Fantasy',
    'Biography',
    'History',
    'Self-Help',
    'Business',
    'Health & Fitness',
    'Travel',
    'Cooking',
    'Art & Design',
    'Technology',
    'Education',
    'Children',
    'Young Adult',
    'Poetry',
    'Drama',
    'Horror',
    'Thriller',
    'Adventure',
    'Religion & Spirituality',
    'Philosophy',
    'Psychology',
    'Science',
    'Politics',
    'Economics',
    'Other'
  ];
  
  useEffect(() => {
    fetchBooks();
  }, [page]);
  
  const fetchBooks = async (filters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      // Build query parameters
      const params = new URLSearchParams({
        page,
        limit: 12,
        ...filters
      });
      
      // Add search filters if they exist
      if (searchTitle) params.append('title', searchTitle);
      if (searchAuthor) params.append('author', searchAuthor);
      if (searchLocation) params.append('location', searchLocation);
      if (searchGenre) params.append('genre', searchGenre);
      if (searchLanguage) params.append('language', searchLanguage);
      
      const response = await axios.get(`http://localhost:5000/books?${params}`, {
        headers: {
          'x-auth-token': token
        }
      });
      
      if (response.data.status === 'success') {
        setBooks(response.data.data);
        setTotalPages(response.data.pagination.pages);
        setTotalBooks(response.data.pagination.total);
      } else {
        setError('Failed to load books');
      }
    } catch (err) {
      console.error('Error fetching books:', err);
      setError('Error loading books. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1); // Reset to first page when searching
    fetchBooks();
  };
  
  const clearFilters = () => {
    setSearchTitle('');
    setSearchAuthor('');
    setSearchLocation('');
    setSearchGenre('');
    setSearchLanguage('');
    setPage(1);
    fetchBooks({});
  };
  
  // Helper function to render star ratings
  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <FaStar
          key={i}
          className={`star ${i <= Math.round(rating) ? '' : 'empty'}`}
        />
      );
    }
    return stars;
  };
    const renderBookCard = (book) => (
    <div 
      key={book._id} 
      className="browse-book-card"
      onClick={() => navigate(`/books/${book._id}`)}
    >
      <div className="browse-book-thumbnail">
        <img 
          src={book.image || '/default-book.jpg'} 
          alt={book.title}
          className="browse-book-image"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/default-book.jpg';
          }}
        />
      </div>
      <div className="browse-book-info">
        <h3 className="browse-book-title">{book.title}</h3>
        <p className="browse-book-author">{book.author}</p>
        {book.genre && (
          <div className="browse-book-genre">
            <FaTags className="browse-genre-icon" />
            <span>{book.genre}</span>
          </div>
        )}
        <div className="browse-book-rating">
          <div className="browse-stars">
            {renderStars(book.rating || 0)}
          </div>
          <span className="browse-reviews-count">
            ({book.reviews?.length || 0})
          </span>
        </div>
        <div className="browse-book-location">{book.location}{book.area ? `, ${book.area}` : ''}</div>
        {book.language && (
          <div className="browse-book-language">
            <span className="language-label">Language:</span> {book.language}
          </div>
        )}
        <div className="browse-book-status">
          <span className={`browse-status-badge ${book.needsReturn ? 'return' : 'gift'}`}>
            {book.needsReturn ? 'Needs Return' : 'Gift'}
          </span>
        </div>
      </div>
    </div>
  );

  // Loading spinner component
  const LoadingSpinner = () => (
    <div className="loading">
      <div className="spinner" style={{ 
        margin: '0 auto 20px',
        border: '4px solid rgba(0, 0, 0, 0.1)',
        borderRadius: '50%',
        borderTop: '4px solid #4361ee',
        width: '40px',
        height: '40px',
        animation: 'spin 1s linear infinite'
      }}></div>
      <p>Loading books...</p>
    </div>
  );
  
  // Empty state component
  const EmptyState = () => (
    <div className="no-books">
      <FaBook style={{ fontSize: '3rem', color: '#4361ee', marginBottom: '1rem' }} />
      <h3 style={{ color: '#2d3748', marginBottom: '0.5rem' }}>No books found</h3>
      <p style={{ color: '#718096', marginBottom: '1rem' }}>
        Try adjusting your search filters or browse all books
      </p>
      <button onClick={clearFilters} style={{ 
        backgroundColor: '#edf2f7', 
        color: '#4a5568',
        border: 'none',
        padding: '8px 16px',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '0.9rem'
      }}>
        Clear All Filters
      </button>
    </div>
  );
  
  return (
    <div className="browse-books-container">
      <div className="browse-header">
        <button onClick={() => navigate('/user-dashboard')} className="back-button">
          <FaArrowLeft /> Back to Dashboard
        </button>
        <h1 className="section-title">
          Browse Books
          <span className="view-all" onClick={() => fetchBooks({})}>View All</span>
        </h1>
      </div>

      {/* Search Section */}
      <div className="search-section">
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-group">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search books by title..."
              value={searchTitle}
              onChange={(e) => setSearchTitle(e.target.value)}
            />
          </div>
          
          <button 
            type="button" 
            className="filter-toggle-button"
            onClick={() => setShowFilters(!showFilters)}
          >
            <FaFilter /> {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
          
          <button type="submit" className="search-button">
            Search
          </button>
        </form>
        
        {showFilters && (
          <div className="advanced-filters">
            <div className="filter-group">
              <label>Author</label>
              <input
                type="text"
                placeholder="Search by author..."
                value={searchAuthor}
                onChange={(e) => setSearchAuthor(e.target.value)}
              />
            </div>
            
            <div className="filter-group">
              <label>Genre</label>
              <select
                value={searchGenre}
                onChange={(e) => setSearchGenre(e.target.value)}
              >
                <option value="">All Genres</option>
                {genres.map(genre => (
                  <option key={genre} value={genre}>
                    {genre}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <label>Location</label>
              <input
                type="text"
                placeholder="Search by location..."
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
              />
            </div>
            
            <div className="filter-group">
              <label>Language</label>
              <input
                type="text"
                placeholder="Search by language..."
                value={searchLanguage}
                onChange={(e) => setSearchLanguage(e.target.value)}
              />
            </div>
            
            <button type="button" className="clear-filters" onClick={clearFilters}>
              Clear Filters
            </button>
          </div>
        )}
      </div>
      
      {/* Books Grid Section */}
      <div className="books-section">
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : books.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="section-header">
              <h2>All Books</h2>
              <div className="section-info" style={{ color: '#718096' }}>
                Found {totalBooks} book{totalBooks !== 1 ? 's' : ''}
              </div>
            </div>          <div className="browse-books-grid">
            {books.map(book => renderBookCard(book))}
          </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {!loading && !error && books.length > 0 && (
        <div className="pagination">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <FaArrowLeft /> Previous
          </button>
          <span className="pagination-info">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next <FaArrowRight />
          </button>
        </div>
      )}
    </div>
  );
};

export default BrowseBooks;