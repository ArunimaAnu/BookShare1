import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdminDashboard.css';

const ComplaintsManagement = () => {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // For response form
  const [response, setResponse] = useState('');
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
          setFilteredComplaints(response.data.data);
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
    
    setFilteredComplaints(result);
  }, [complaints, filterStatus, searchTerm]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleViewComplaint = (complaint) => {
    setSelectedComplaint(complaint);
    setResponse('');
  };

  const handleCloseComplaint = () => {
    setSelectedComplaint(null);
  };

  const handleSubmitResponse = async () => {
    if (!response.trim() || !selectedComplaint) return;
    
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      
      const responseData = await axios.put(
        `http://localhost:5000/admin/complaints/${selectedComplaint._id}`,
        { 
          status: 'Resolved',
          adminResponse: response 
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
              ? { ...complaint, status: 'Resolved', adminResponse: response }
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
            className="nav-item"
            onClick={() => navigate('/admin/books')}
          >
            Book Management
          </button>
          <button
            className="nav-item active"
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
          <h1>Complaints Management</h1>
        </div>

        <div className="admin-main">
          {error && <div className="error-message">{error}</div>}

          <div className="complaints-container">
            <div className="filters-container">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Search complaints..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
              <div className="status-filter">
                <select 
                  value={filterStatus} 
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="status-select"
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
                <div className="detail-header">
                  <h2>Complaint Details</h2>
                  <button 
                    className="close-button"
                    onClick={handleCloseComplaint}
                  >
                    &times;
                  </button>
                </div>
                
                <div className="detail-content">
                  <div className="detail-row">
                    <strong>Subject:</strong> 
                    <span>{selectedComplaint.subject}</span>
                  </div>
                  <div className="detail-row">
                    <strong>Submitted by:</strong>
                    <span>{selectedComplaint.user.name} ({selectedComplaint.user.email})</span>
                  </div>
                  <div className="detail-row">
                    <strong>Date:</strong>
                    <span>{new Date(selectedComplaint.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="detail-row">
                    <strong>Status:</strong>
                    <span className={`status-badge ${selectedComplaint.status.toLowerCase()}`}>
                      {selectedComplaint.status}
                    </span>
                  </div>
                  <div className="detail-row description">
                    <strong>Description:</strong>
                    <div className="complaint-description">
                      {selectedComplaint.description}
                    </div>
                  </div>
                  
                  {selectedComplaint.adminResponse && (
                    <div className="detail-row admin-response">
                      <strong>Admin Response:</strong>
                      <div className="response-content">
                        {selectedComplaint.adminResponse}
                      </div>
                    </div>
                  )}
                  
                  {selectedComplaint.status !== 'Resolved' && (
                    <div className="response-form">
                      <h3>Respond to Complaint</h3>
                      <textarea
                        value={response}
                        onChange={(e) => setResponse(e.target.value)}
                        placeholder="Type your response here..."
                        rows={5}
                        className="response-textarea"
                      />
                      <div className="form-actions">
                        <button 
                          className="respond-button"
                          onClick={handleSubmitResponse}
                          disabled={!response.trim() || submitting}
                        >
                          {submitting ? 'Submitting...' : 'Submit Response & Resolve'}
                        </button>
                        <button 
                          className="mark-button"
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
              </div>
            ) : (
              <div className="complaints-list">
                <h2>All Complaints ({filteredComplaints.length})</h2>
                {filteredComplaints.length === 0 ? (
                  <div className="no-complaints">
                    {searchTerm || filterStatus !== 'all' 
                      ? 'No complaints match your filters.' 
                      : 'No complaints found.'}
                  </div>
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
                      {filteredComplaints.map(complaint => (
                        <tr key={complaint._id}>
                          <td>{complaint.subject}</td>
                          <td>{complaint.user.name}</td>
                          <td>{new Date(complaint.createdAt).toLocaleDateString()}</td>
                          <td>
                            <span className={`status-badge ${complaint.status.toLowerCase()}`}>
                              {complaint.status}
                            </span>
                          </td>
                          <td>
                            <button
                              className="view-button"
                              onClick={() => handleViewComplaint(complaint)}
                            >
                              View
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
    </div>
  );
};

export default ComplaintsManagement;