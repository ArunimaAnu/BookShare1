import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ComplaintsManagement.css';

const ComplaintsManagement = () => {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        if (!token) {
          navigate('/login');
          return;
        }

        const response = await axios.get('http://localhost:5000/admin/complaints', {
          headers: {
            'x-auth-token': token
          }
        });

        if (response.data.status === 'success') {
          setComplaints(response.data.data);
        } else {
          setError('Failed to load complaints');
        }
      } catch (err) {
        console.error('Error fetching complaints:', err);
        setError('Error loading complaints data');

        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, [navigate]);

  useEffect(() => {
    let result = complaints;
    
    // Filter by status
    if (filterStatus !== 'all') {
      result = result.filter(complaint => complaint.status.toLowerCase() === filterStatus);
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        complaint => 
          complaint.subject.toLowerCase().includes(term) || 
          complaint.description.toLowerCase().includes(term) ||
          complaint.user.name.toLowerCase().includes(term) ||
          complaint.user.email.toLowerCase().includes(term)
      );
    }
    
    setComplaints(result);
  }, [complaints, filterStatus, searchTerm]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleViewComplaint = (complaint) => {
    setSelectedComplaint(complaint);
    setResponseText('');
  };

  const handleCloseComplaint = () => {
    setSelectedComplaint(null);
  };

  const handleSubmitResponse = async () => {
    if (!responseText.trim() || !selectedComplaint) return;
    
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      
      const responseData = await axios.put(
        `http://localhost:5000/admin/complaints/${selectedComplaint._id}`,
        { 
          status: 'Resolved',
          adminResponse: responseText 
        },
        {
          headers: {
            'x-auth-token': token
          }
        }
      );
      
      if (responseData.data.status === 'success') {
        // Update the complaints list
        setComplaints(prevComplaints => 
          prevComplaints.map(complaint => 
            complaint._id === selectedComplaint._id 
              ? { ...complaint, status: 'Resolved', adminResponse: responseText }
              : complaint
          )
        );
        
        // Close the detail view
        setSelectedComplaint(null);
      } else {
        setError('Failed to update complaint');
      }
    } catch (err) {
      console.error('Error updating complaint:', err);
      setError('Error updating complaint');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard-container">
        <div className="loading">Loading complaints data...</div>
      </div>
    );
  }

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
            className="admindash-nav-item"
            onClick={() => navigate('/admin/books')}
          >
            Book Management
          </button>
          <button
            className="admindash-nav-item active"
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
          <h1>Complaints Management</h1>
        </div>

        <div className="admindash-main">
          {error && <div className="admindash-error">{error}</div>}

          <div className="complaints-filters">
            <div className="complaints-search-box">
              <input
                type="text"
                placeholder="Search complaints..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="complaints-search-input"
              />
            </div>
            <div className="complaints-status-filter">
              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>

          {selectedComplaint ? (
            <div className="complaint-detail">
              <div className="complaint-detail-header">
                <h2>Complaint Details</h2>
                <button 
                  className="close-complaint-button"
                  onClick={handleCloseComplaint}
                >
                  &times;
                </button>
              </div>
              
              <div className="complaint-detail-row">
                <strong>Subject:</strong> 
                <span>{selectedComplaint.subject}</span>
              </div>
              <div className="complaint-detail-row">
                <strong>Submitted by:</strong>
                <span>{selectedComplaint.user.name} ({selectedComplaint.user.email})</span>
              </div>
              <div className="complaint-detail-row">
                <strong>Date:</strong>
                <span>{new Date(selectedComplaint.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="complaint-detail-row">
                <strong>Status:</strong>
                <span className={`complaint-status-badge ${selectedComplaint.status.toLowerCase()}`}>
                  {selectedComplaint.status}
                </span>
              </div>
              <div className="complaint-detail-row">
                <strong>Description:</strong>
                <div className="complaint-description">
                  {selectedComplaint.description}
                </div>
              </div>
              
              {selectedComplaint.status !== 'Resolved' && (
                <div className="complaint-response-form">
                  <h3>Respond to Complaint</h3>
                  <textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Type your response here..."
                    rows={5}
                    className="response-textarea"
                  />
                  <div className="complaint-action-buttons">
                    <button 
                      className="submit-response-button"
                      onClick={handleSubmitResponse}
                      disabled={!responseText.trim() || submitting}
                    >
                      {submitting ? 'Submitting...' : 'Submit Response & Resolve'}
                    </button>
                    <button 
                      className="mark-status-button"
                      onClick={() => {
                        setSelectedComplaint({
                          ...selectedComplaint,
                          status: selectedComplaint.status === 'Pending' ? 'In Progress' : 'Pending'
                        });
                      }}
                    >
                      Mark as {selectedComplaint.status === 'Pending' ? 'In Progress' : 'Pending'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="complaints-table-container">
              {loading ? (
                <div className="loading">Loading complaints...</div>
              ) : (
                <table className="complaints-table">
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>User</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {complaints.map(complaint => (
                      <tr key={complaint._id}>
                        <td>{complaint.subject}</td>
                        <td>{complaint.user.name}</td>
                        <td>{new Date(complaint.createdAt).toLocaleDateString()}</td>
                        <td>
                          <span className={`complaint-status-badge ${complaint.status.toLowerCase()}`}>
                            {complaint.status}
                          </span>
                        </td>
                        <td>
                          <button
                            className="view-complaint-button"
                            onClick={() => handleViewComplaint(complaint)}
                          >
                            View Details
                          </button>
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
  );
};

export default ComplaintsManagement;