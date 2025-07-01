import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaUpload, FaArrowLeft, FaStar } from 'react-icons/fa';
import './AddBook.css';

const AddBook = () => {
  const navigate = useNavigate();
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
  const [loading, setLoading] = useState(false);
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
  
  const handleRatingChange = (rating) => {
    setFormData({
      ...formData,
      rating
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
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
      
      const response = await axios.post(
        'http://localhost:5000/books',
        submitFormData,
        {
          headers: {
            'x-auth-token': token,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      if (response.data.status === 'success') {
        navigate('/user-dashboard');
      } else {
        setError(response.data.message || 'Failed to add book');
      }
    } catch (err) {
      console.error('Error adding book:', err);
      setError(err.response?.data?.message || 'Error adding book. Please try again.');
    } finally {
      setLoading(false);
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
  
  return (
    <div className="add-book-container">
      <div className="add-book-header">
        <button onClick={() => navigate(-1)} className="back-button">
          <FaArrowLeft /> Back
        </button>
        <h1>Add New Book</h1>
      </div>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <div className="add-book-content">
        <form onSubmit={handleSubmit} className="add-book-form">
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
                      <button
                        type="button"
                        className="change-image-button"
                        onClick={() => {
                          setImage(null);
                          setImagePreview(null);
                        }}
                      >
                        Remove
                      </button>
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
              disabled={loading}
            >
              {loading ? 'Adding Book...' : 'Add Book'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBook;