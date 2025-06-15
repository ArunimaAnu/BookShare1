import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiPlus, FiEdit2, FiTrash2, FiBook } from 'react-icons/fi';
import './BookManagement.css';

const BookManagement = () => {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookForm, setBookForm] = useState({
    title: '',
    author: '',
    description: '',
    image: '',
    category: 'Fiction',
    publishedYear: '',
    isbn: '',
    price: ''
  });
  const [bookFormMode, setBookFormMode] = useState('add'); // 'add' or 'edit'
  const [editingBookId, setEditingBookId] = useState(null);
  const [bookFormVisible, setBookFormVisible] = useState(false);

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

  const handleBookFormChange = (e) => {
    const { name, value } = e.target;
    setBookForm({
      ...bookForm,
      [name]: value
    });
  };

  const handleBookSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      let response;

      // Validate required fields
      if (!bookForm.title || !bookForm.author || !bookForm.description || !bookForm.image || !bookForm.category) {
        setError('Please fill all required fields');
        return;
      }

      if (bookFormMode === 'add') {
        // Add new book
        response = await axios.post(
          'http://localhost:5000/books',
          bookForm,
          {
            headers: {
              'x-auth-token': token
            }
          }
        );
      } else {
        // Update existing book
        response = await axios.put(
          `http://localhost:5000/books/${editingBookId}`,
          bookForm,
          {
            headers: {
              'x-auth-token': token
            }
          }
        );
      }

      if (response.data.status === 'success') {
        // Refresh book list
        fetchBooks();

        // Reset form
        setBookForm({
          title: '',
          author: '',
          description: '',
          image: '',
          category: 'Fiction',
          publishedYear: '',
          isbn: '',
          price: ''
        });

        setBookFormVisible(false);
        setBookFormMode('add');
        setEditingBookId(null);
      } else {
        setError(response.data.message || 'Failed to save book');
      }
    } catch (err) {
      console.error('Error saving book:', err);
      setError(err.response?.data?.message || 'Error saving book');
    }
  };

  const handleEditBook = (book) => {
    setBookForm({
      title: book.title,
      author: book.author,
      description: book.description,
      image: book.image,
      category: book.category,
      publishedYear: book.publishedYear || '',
      isbn: book.isbn || '',
      price: book.price || ''
    });

    setBookFormMode('edit');
    setEditingBookId(book._id);
    setBookFormVisible(true);
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

  return (
    <div className="book-mgmt-container">
      <div className="book-mgmt-sidebar">
        <div className="book-mgmt-logo">
          <FiBook />
          BookShare Admin
        </div>
        <nav className="book-mgmt-nav">
          <button className="book-mgmt-nav-item active">
            Books
          </button>
          <button 
            className="book-mgmt-nav-item logout"
            onClick={() => {
              localStorage.removeItem('token');
              navigate('/login');
            }}
          >
            Logout
          </button>
        </nav>
      </div>

      <div className="book-mgmt-content">
        <div className="book-mgmt-header">
          <h1>Book Management</h1>
          <button 
            className="book-mgmt-add-button"
            onClick={() => {
              setBookForm({
                title: '',
                author: '',
                description: '',
                image: '',
                category: 'Fiction',
                publishedYear: '',
                isbn: '',
                price: ''
              });
              setBookFormMode('add');
              setBookFormVisible(true);
              setEditingBookId(null);
            }}
          >
            <FiPlus /> Add New Book
          </button>
        </div>

        <div className="book-mgmt-main">
          {error && <div className="book-mgmt-error-message">{error}</div>}
          
          {loading ? (
            <div className="book-mgmt-loading">Loading books...</div>
          ) : (
            <>
              {bookFormVisible && (
                <div className="book-form-container">
                  <form className="book-form" onSubmit={handleBookSubmit}>
                    <div className="book-form-group">
                      <label className="book-form-label">Title</label>
                      <input
                        type="text"
                        name="title"
                        value={bookForm.title}
                        onChange={handleBookFormChange}
                        className="book-form-input"
                        required
                      />
                    </div>
                    <div className="book-form-group">
                      <label className="book-form-label">Author</label>
                      <input
                        type="text"
                        name="author"
                        value={bookForm.author}
                        onChange={handleBookFormChange}
                        className="book-form-input"
                        required
                      />
                    </div>
                    <div className="book-form-group">
                      <label className="book-form-label">Category</label>
                      <select
                        name="category"
                        value={bookForm.category}
                        onChange={handleBookFormChange}
                        className="book-form-select"
                        required
                      >
                        <option value="Fiction">Fiction</option>
                        <option value="Non-Fiction">Non-Fiction</option>
                        <option value="Science">Science</option>
                        <option value="Technology">Technology</option>
                        <option value="History">History</option>
                        <option value="Biography">Biography</option>
                        <option value="Children">Children</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="book-form-group">
                      <label className="book-form-label">Image URL</label>
                      <input
                        type="text"
                        name="image"
                        value={bookForm.image}
                        onChange={handleBookFormChange}
                        className="book-form-input"
                        required
                      />
                    </div>
                    <div className="book-form-group">
                      <label className="book-form-label">Published Year</label>
                      <input
                        type="number"
                        name="publishedYear"
                        value={bookForm.publishedYear}
                        onChange={handleBookFormChange}
                        className="book-form-input"
                      />
                    </div>
                    <div className="book-form-group">
                      <label className="book-form-label">ISBN</label>
                      <input
                        type="text"
                        name="isbn"
                        value={bookForm.isbn}
                        onChange={handleBookFormChange}
                        className="book-form-input"
                      />
                    </div>
                    <div className="book-form-group">
                      <label className="book-form-label">Price</label>
                      <input
                        type="number"
                        name="price"
                        value={bookForm.price}
                        onChange={handleBookFormChange}
                        className="book-form-input"
                      />
                    </div>
                    <div className="book-form-group" style={{ gridColumn: 'span 2' }}>
                      <label className="book-form-label">Description</label>
                      <textarea
                        name="description"
                        value={bookForm.description}
                        onChange={handleBookFormChange}
                        className="book-form-textarea"
                        required
                      />
                    </div>
                    <button type="submit" className="book-form-submit">
                      {bookFormMode === 'add' ? 'Add Book' : 'Update Book'}
                    </button>
                  </form>
                </div>
              )}

              <div className="book-mgmt-grid">
                {books.map((book) => (
                  <div key={book._id} className="book-mgmt-card">
                    <div className="book-mgmt-image-container">
                      <img
                        src={book.image}
                        alt={book.title}
                        className="book-mgmt-image"
                      />
                    </div>
                    <div className="book-mgmt-content-wrapper">
                      <h3 className="book-mgmt-book-title">{book.title}</h3>
                      <p className="book-mgmt-book-author">by {book.author}</p>
                      <div className="book-mgmt-actions">
                        <button
                          className="book-mgmt-button book-mgmt-button-edit"
                          onClick={() => {
                            setBookForm(book);
                            setBookFormMode('edit');
                            setBookFormVisible(true);
                            setEditingBookId(book._id);
                          }}
                        >
                          <FiEdit2 /> Edit
                        </button>
                        <button
                          className="book-mgmt-button book-mgmt-button-delete"
                          onClick={() => handleDeleteBook(book._id)}
                        >
                          <FiTrash2 /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookManagement;