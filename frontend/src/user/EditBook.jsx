import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { FaUpload, FaArrowLeft, FaStar, FaTrash } from 'react-icons/fa';
import './EditBook.css';

const EditBook = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    genre: '',
    description: '',
    rating: 0,
    location: '',
    area: '',
    language: 'English',
    needsReturn: false
  });
  
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [originalImage, setOriginalImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
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
    const fetchBook = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
        
        const response = await axios.get(`http://localhost:5000/books/${id}`, {
          headers: {
            'x-auth-token': token
          }
        });
        
        if (response.data.status === 'success') {
          const book = response.data.data;
          
          // Populate form data
          setFormData({
            title: book.title,
            author: book.author,
            genre: book.genre || '',
            description: book.description || '',
            rating: book.rating || 0,
            location: book.location,
            area: book.area || '',
            language: book.language || 'English',
            needsReturn: book.needsReturn
          });
          
          // Set image preview if book has an image
          if (book.image) {
            setOriginalImage(book.image);
            setImagePreview(book.image);
          }
        } else {
          setError('Failed to load book details');
        }
      } catch (err) {
        console.error('Error fetching book:', err);
        setError(err.response?.data?.message || 'Error loading book details');
        
        if (err.response && (err.response.status === 403 || err.response.status === 404)) {
          navigate('/user-dashboard');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchBook();
  }, [id, navigate]);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const resetImage = () => {
    setImage(null);
    setImagePreview(originalImage);
  };
  
  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
    setOriginalImage(null);
  };
  
  const handleRatingChange = (rating) => {
    setFormData({
      ...formData,
      rating
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      // Create form data for file upload
      const submitFormData = new FormData();
      Object.keys(formData).forEach(key => {
        submitFormData.append(key, formData[key]);
      });
      
      if (image) {
        submitFormData.append('image', image);
      }
      
      const response = await axios.put(
        `http://localhost:5000/books/${id}`,
        submitFormData,
        {
          headers: {
            'x-auth-token': token,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      if (response.data.status === 'success') {
        navigate(`/books/${id}`);
      } else {
        setError(response.data.message || 'Failed to update book');
      }
    } catch (err) {
      console.error('Error updating book:', err);
      setError(err.response?.data?.message || 'Error updating book. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleDeleteBook = async () => {
    if (!window.confirm('Are you sure you want to delete this book? This action cannot be undone.')) {
      return;
    }
    
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      const response = await axios.delete(
        `http://localhost:5000/books/${id}`,
        {
          headers: {
            'x-auth-token': token
          }
        }
      );
      
      if (response.data.status === 'success') {
        navigate('/user-dashboard');
      } else {
        setError(response.data.message || 'Failed to delete book');
      }
    } catch (err) {
      console.error('Error deleting book:', err);
      setError(err.response?.data?.message || 'Error deleting book. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  const StarRating = ({ value, onChange }) => {
    return (
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map(star => (
          <span
            key={star}
            className={`star ${star <= value ? 'filled' : ''}`}
            onClick={() => onChange(star)}
          >
            <FaStar />
          </span>
        ))}
      </div>
    );
  };
  
  if (loading) {
    return (
      <div className="edit-book-loading">
        <div className="spinner"></div>
        <p>Loading book details...</p>
      </div>
    );
  }
  
  return (
    <div className="edit-book-container">
      <div className="edit-book-header">
        <button onClick={() => navigate(-1)} className="back-button">
          <FaArrowLeft /> Back
        </button>
        <h1>Edit Book</h1>
        <button onClick={handleDeleteBook} className="delete-button" disabled={submitting}>
          <FaTrash /> Delete Book
        </button>
      </div>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <div className="edit-book-content">
        <form onSubmit={handleSubmit} className="edit-book-form">
          <div className="form-columns">
            <div className="form-left">
              <div className="form-group">
                <label htmlFor="title">Title *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder="Enter book title"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="author">Author *</label>
                <input
                  type="text"
                  id="author"
                  name="author"
                  value={formData.author}
                  onChange={handleChange}
                  required
                  placeholder="Enter author name"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="genre">Genre *</label>
                <select
                  id="genre"
                  name="genre"
                  value={formData.genre}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select a genre</option>
                  {genres.map(genre => (
                    <option key={genre} value={genre}>
                      {genre}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="location">Location *</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  required
                  placeholder="City or general location"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="area">Area (Optional)</label>
                <input
                  type="text"
                  id="area"
                  name="area"
                  value={formData.area}
                  onChange={handleChange}
                  placeholder="Neighborhood or specific area"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="language">Language</label>
                <input
                  type="text"
                  id="language"
                  name="language"
                  value={formData.language}
                  onChange={handleChange}
                  placeholder="Book language"
                />
              </div>
              
              <div className="form-group">
                <label>Rating</label>
                <StarRating 
                  value={formData.rating} 
                  onChange={handleRatingChange} 
                />
              </div>
              
              <div className="form-group checkbox-group">
                <input
                  type="checkbox"
                  id="needsReturn"
                  name="needsReturn"
                  checked={formData.needsReturn}
                  onChange={handleChange}
                />
                <label htmlFor="needsReturn">Book needs to be returned</label>
              </div>
            </div>
            
            <div className="form-right">
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="6"
                  placeholder="Add details about the book's condition, content, etc."
                ></textarea>
              </div>
              
              <div className="form-group">
                <label>Book Cover Image</label>
                <div className="image-upload-container">
                  {imagePreview ? (
                    <div className="image-preview">
                      <img src={imagePreview} alt="Book cover preview" />
                      <div className="image-actions">
                        {originalImage && image && (
                          <button
                            type="button"
                            className="reset-image-button"
                            onClick={resetImage}
                          >
                            Reset
                          </button>
                        )}
                        <button
                          type="button"
                          className="change-image-button"
                          onClick={removeImage}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="upload-placeholder">
                      <FaUpload />
                      <p>Upload book cover image</p>
                      <input
                        type="file"
                        id="image"
                        name="image"
                        onChange={handleImageChange}
                        accept="image/*"
                      />
                    </div>
                  )}
                </div>
                <small>Max file size: 5MB. Recommended size: 500x700 pixels.</small>
              </div>
            </div>
          </div>
          
          <div className="form-submit">
            <button
              type="submit"
              className="submit-button"
              disabled={submitting}
            >
              {submitting ? 'Updating...' : 'Update Book'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditBook;