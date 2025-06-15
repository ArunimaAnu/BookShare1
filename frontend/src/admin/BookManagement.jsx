import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdminDashboard.css';

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
          <h1>Book Management</h1>
        </div>

        <div className="admin-main">
          {error && <div className="error-message">{error}</div>}

          <div className="books-management-container">
            <div className="books-header">
              <div className="button-group">
                <button
                  onClick={() => {
                    setBookFormVisible(true);
                    setBookFormMode('add');
                    setEditingBookId(null);
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
                  }}
                  className="add-book-button"
                >
                  Add New Book
                </button>
                <button
                  onClick={() => navigate('/admin/browse-books')}
                  className="browse-books-button"
                >
                  Browse All Books
                </button>
              </div>
            </div>

            {bookFormVisible && (
              <div className="book-form-container">
                <h3>{bookFormMode === 'add' ? 'Add New Book' : 'Edit Book'}</h3>
                <form onSubmit={handleBookSubmit} className="book-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="title">Title*</label>
                      <input
                        type="text"
                        id="title"
                        name="title"
                        value={bookForm.title}
                        onChange={handleBookFormChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="author">Author*</label>
                      <input
                        type="text"
                        id="author"
                        name="author"
                        value={bookForm.author}
                        onChange={handleBookFormChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="image">Image URL*</label>
                      <input
                        type="url"
                        id="image"
                        name="image"
                        value={bookForm.image}
                        onChange={handleBookFormChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="category">Category*</label>
                      <select
                        id="category"
                        name="category"
                        value={bookForm.category}
                        onChange={handleBookFormChange}
                        required
                      >
                        <option value="Fiction">Fiction</option>
                        <option value="Non-fiction">Non-fiction</option>
                        <option value="Science">Science</option>
                        <option value="Technology">Technology</option>
                        <option value="History">History</option>
                        <option value="Biography">Biography</option>
                        <option value="Self-help">Self-help</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="publishedYear">Published Year</label>
                      <input
                        type="number"
                        id="publishedYear"
                        name="publishedYear"
                        value={bookForm.publishedYear}
                        onChange={handleBookFormChange}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="isbn">ISBN</label>
                      <input
                        type="text"
                        id="isbn"
                        name="isbn"
                        value={bookForm.isbn}
                        onChange={handleBookFormChange}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="price">Price</label>
                      <input
                        type="number"
                        id="price"
                        name="price"
                        value={bookForm.price}
                        onChange={handleBookFormChange}
                        step="0.01"
                      />
                    </div>
                  </div>

                  <div className="form-group full-width">
                    <label htmlFor="description">Description*</label>
                    <textarea
                      id="description"
                      name="description"
                      value={bookForm.description}
                      onChange={handleBookFormChange}
                      rows={5}
                      required
                    ></textarea>
                  </div>

                  <div className="form-buttons">
                    <button type="submit" className="save-button">
                      {bookFormMode === 'add' ? 'Add Book' : 'Update Book'}
                    </button>
                    <button
                      type="button"
                      className="cancel-button"
                      onClick={() => setBookFormVisible(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {loading ? (
              <div className="loading">Loading books...</div>
            ) : (
              <div className="books-table-container">
                {books.length === 0 ? (
                  <div className="no-books">No books available. Add some books to get started.</div>
                ) : (
                  <table className="books-table">
                    <thead>
                      <tr>
                        <th>Image</th>
                        <th>Title</th>
                        <th>Author</th>
                        <th>Category</th>
                        <th>Reviews</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {books.map((book) => (
                        <tr key={book._id}>
                          <td className="book-image-cell">
                            <img src={book.image} alt={book.title} className="book-thumbnail" />
                          </td>
                          <td>{book.title}</td>
                          <td>{book.author}</td>
                          <td>{book.category}</td>
                          <td>
                            {book.reviews.length} ({book.reviews && book.reviews.length > 0
                              ? (book.reviews.reduce((sum, review) => sum + review.rating, 0) / book.reviews.length).toFixed(1)
                              : '0.0'})
                          </td>
                          <td>
                            <div className="book-actions">
                              <button
                                onClick={() => handleEditBook(book)}
                                className="edit-button"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteBook(book._id)}
                                className="delete-button"
                              >
                                Delete
                              </button>
                              <button
                                onClick={() => navigate(`/books/${book._id}`)}
                                className="view-button"
                              >
                                View
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookManagement;