import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { FaExclamationTriangle, FaCheckCircle, FaClock, FaSpinner, FaArrowLeft } from 'react-icons/fa';
import './ComplaintPage.css';

const ComplaintPage = () => {
  const navigate = useNavigate();
  const { exchangeId } = useParams();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [exchange, setExchange] = useState(null);
  
  const [complaintData, setComplaintData] = useState({
    subject: '',
    description: '',
    category: 'other'
  });

  useEffect(() => {
    fetchComplaints();
    if (exchangeId) {
      fetchExchangeDetails();
    }
  }, [exchangeId]);

  const fetchExchangeDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/exchanges/${exchangeId}`, {
        headers: { 'x-auth-token': token }
      });

      if (response.data.status === 'success') {
        setExchange(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching exchange details:', err);
      setError('Failed to load exchange details');
    }
  };

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/complaints/user', {
        headers: { 'x-auth-token': token }
      });

      if (response.data.status === 'success') {
        setComplaints(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching complaints:', err);
      setError('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setComplaintData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      if (!token || !userId) {
        setError('Please log in to submit a complaint');
        setLoading(false);
        return;
      }

      // Validate category
      if (!['behavior', 'book_condition', 'no_show', 'payment', 'communication', 'other'].includes(complaintData.category)) {
        setError('Invalid category selected');
        setLoading(false);
        return;
      }

      let complaintPayload = {
        subject: complaintData.subject.trim(),
        description: complaintData.description.trim(),
        category: complaintData.category,
        user: localStorage.getItem('userId')
      };

      if (exchange) {
        const otherParty = exchange.ownerId._id === localStorage.getItem('userId') 
          ? exchange.borrowerId 
          : exchange.ownerId;

        complaintPayload = {
          ...complaintPayload,
          exchangeId: exchange._id,
          complaineeId: otherParty._id,
          complaineeName: otherParty.name,
          bookId: exchange.bookId._id,
          bookTitle: exchange.bookId.title
        };
      }

      // Add proper error handling for validation
      if (!complaintPayload.subject || !complaintPayload.description || !complaintPayload.category) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      const response = await axios.post(
        'http://localhost:5000/complaints',
        complaintPayload,
        {
          headers: { 
            'x-auth-token': token,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.status === 'success') {
        fetchComplaints();
        setShowForm(false);
        setComplaintData({
          subject: '',
          description: '',
          category: 'other'
        });
      }
    } catch (err) {
      console.error('Error submitting complaint:', err);
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        setError(err.response.data.errors.join('\n'));
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to submit complaint. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending':
        return <FaClock className="status-icon pending" />;
      case 'In Progress':
        return <FaSpinner className="status-icon in-progress" />;
      case 'Resolved':
        return <FaCheckCircle className="status-icon resolved" />;
      default:
        return <FaExclamationTriangle className="status-icon" />;
    }
  };

  const handleBackToDashboard = () => {
    navigate('/user-dashboard');
  };

  return (
    <div className="complaint-page">
      <div className="page-navigation">
        <button 
          className="back-to-dashboard-btn"
          onClick={handleBackToDashboard}
        >
          <FaArrowLeft className="back-icon" />
          Back to Dashboard
        </button>
      </div>

      <div className="complaint-header">
        <h1>{exchangeId ? 'File Exchange Complaint' : 'Complaints Center'}</h1>
        {!exchangeId && (
          <button 
            className="new-complaint-btn"
            onClick={() => setShowForm(true)}
          >
            New Complaint
          </button>
        )}
      </div>

      {error && (
        <div className="error-message">
          <FaExclamationTriangle /> {error}
        </div>
      )}

      {(showForm || exchangeId) && (
        <div className="complaint-form-container">
          <h2>Submit a Complaint</h2>
          {exchange && (
            <div className="exchange-info">
              <p><strong>Book:</strong> {exchange.bookId.title}</p>
              <p><strong>Exchange with:</strong> {
                exchange.ownerId._id === localStorage.getItem('userId') 
                  ? exchange.borrowerId.name 
                  : exchange.ownerId.name
              }</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="complaint-form">
            <div className="form-group">
              <label htmlFor="subject">Subject:</label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={complaintData.subject}
                onChange={handleInputChange}
                required
                maxLength="100"
                placeholder="Brief subject of your complaint"
              />
            </div>

            <div className="form-group">
              <label htmlFor="category">Category:</label>
              <select
                id="category"
                name="category"
                value={complaintData.category}
                onChange={handleInputChange}
                required
              >
                <option value="behavior">User Behavior</option>
                <option value="book_condition">Book Condition</option>
                <option value="no_show">No Show/Late</option>
                <option value="payment">Payment Issue</option>
                <option value="communication">Communication</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description:</label>
              <textarea
                id="description"
                name="description"
                value={complaintData.description}
                onChange={handleInputChange}
                required
                minLength="10"
                rows="5"
                placeholder="Provide detailed information about your complaint"
              />
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                className="cancel-btn"
                onClick={() => {
                  setShowForm(false);
                  if (exchangeId) navigate(-1);
                }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="submit-btn"
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit Complaint'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="complaints-list">
        <h2>Your Complaints</h2>
        {loading && !complaints.length ? (
          <div className="loading">Loading complaints...</div>
        ) : complaints.length === 0 ? (
          <div className="no-complaints">
            You haven't filed any complaints yet.
          </div>
        ) : (
          <div className="complaints-grid">
            {complaints.map(complaint => (
              <div key={complaint._id} className="complaint-card">
                <div className="complaint-header">
                  <span className={`status-badge ${complaint.status.toLowerCase()}`}>
                    {getStatusIcon(complaint.status)} {complaint.status}
                  </span>
                  <span className="date">
                    {new Date(complaint.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h3>{complaint.subject}</h3>
                <div className="complaint-category">
                  {complaint.metadata.category.replace('_', ' ')}
                </div>
                {complaint.metadata.bookTitle && (
                  <div className="complaint-book">
                    Book: {complaint.metadata.bookTitle}
                  </div>
                )}
                <div className="complaint-description">
                  {complaint.description}
                </div>
                {complaint.adminResponse && (
                  <div className="admin-response">
                    <strong>Admin Response:</strong>
                    <p>{complaint.adminResponse}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ComplaintPage;