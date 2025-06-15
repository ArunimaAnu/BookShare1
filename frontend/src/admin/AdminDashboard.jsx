import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBooks: 0,
    totalReviews: 0,
    totalComplaints: 0
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentBooks, setRecentBooks] = useState([]);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token');

        if (!token) {
          navigate('/login');
          return;
        }

        // Fetch data in parallel
        const [usersResponse, booksResponse, complaintsResponse] = await Promise.all([
          axios.get('http://localhost:5000/admin/users', {
            headers: { 'x-auth-token': token }
          }),
          axios.get('http://localhost:5000/books?limit=100', {
            headers: { 'x-auth-token': token }
          }),
          axios.get('http://localhost:5000/admin/complaints', {
            headers: { 'x-auth-token': token }
          })
        ]);

        // Validate responses
        if (!usersResponse.data || usersResponse.data.status !== 'success') {
          throw new Error('Failed to fetch users data');
        }

        if (!booksResponse.data || booksResponse.data.status !== 'success') {
          throw new Error('Failed to fetch books data');
        }

        if (!complaintsResponse.data || complaintsResponse.data.status !== 'success') {
          throw new Error('Failed to fetch complaints data');
        }

        // Calculate stats
        const totalReviews = booksResponse.data.data.reduce(
          (sum, book) => sum + (book.reviews?.length || 0), 
          0
        );

        // Update all states
        setStats({
          totalUsers: usersResponse.data.data.length,
          totalBooks: booksResponse.data.data.length,
          totalReviews: totalReviews,
          totalComplaints: complaintsResponse.data.data.length
        });

        setRecentUsers(usersResponse.data.data.slice(0, 5));
        setRecentBooks(booksResponse.data.data.slice(0, 5));
        setRecentComplaints(complaintsResponse.data.data.slice(0, 5));

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message || 'Error loading dashboard data');

        if (err.response?.status === 401 || err.response?.status === 403) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="admin-dashboard-container">
        <div className="loading">Loading dashboard data...</div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-container">      <div className="admindash-sidebar">
        <div className="admindash-logo">Admin Dashboard</div>
        <nav className="admindash-nav">
          <button
            className="admindash-nav-item active"
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
          <h1>Admin Dashboard</h1>
        </div>

        <div className="admindash-main">
          {error && <div className="admindash-error-message">{error}</div>}

          <div className="admindash-container">
            <div className="admindash-stat-cards">
              <div className="admindash-stat-card">
                <div className="admindash-stat-icon admindash-users-icon">👤</div>
                <div className="admindash-stat-info">
                  <div className="admindash-stat-value">{stats.totalUsers}</div>
                  <div className="admindash-stat-label">Total Users</div>
                </div>
              </div>

              <div className="admindash-stat-card">
                <div className="admindash-stat-icon admindash-books-icon">📚</div>
                <div className="admindash-stat-info">
                  <div className="admindash-stat-value">{stats.totalBooks}</div>
                  <div className="admindash-stat-label">Total Books</div>
                </div>
              </div>

              <div className="admindash-stat-card">
                <div className="admindash-stat-icon admindash-reviews-icon">⭐</div>
                <div className="admindash-stat-info">
                  <div className="admindash-stat-value">{stats.totalReviews}</div>
                  <div className="admindash-stat-label">Total Reviews</div>
                </div>
              </div>

              <div className="admindash-stat-card">
                <div className="admindash-stat-icon admindash-reviews-icon">🔔</div>
                <div className="admindash-stat-info">
                  <div className="admindash-stat-value">{stats.totalComplaints}</div>
                  <div className="admindash-stat-label">Total Complaints</div>
                </div>
              </div>
            </div>

            <div className="admindash-quick-actions">
              <h2>Quick Actions</h2>
              <div className="admindash-action-buttons">
                <button
                  className="admindash-action-button"
                  onClick={() => navigate('/admin/users')}
                >
                  Manage Users
                </button>
                <button
                  className="action-button"
                  onClick={() => navigate('/admin/books')}
                >
                  Manage Books
                </button>                <button
                  className="admindash-action-button"
                  onClick={() => navigate('/admin/complaints')}
                >
                  View Complaints
                </button>
              </div>
            </div>

            <div className="admindash-sections">
              <div className="admindash-recent-section">
                <h2>Recent Users</h2>
                <table className="admindash-mini-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentUsers.map(user => (
                      <tr key={user._id}>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>
                          <span className={`admindash-role-badge ${user.role}`}>
                            {user.role}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button
                  className="admindash-view-all-button"
                  onClick={() => navigate('/admin/users')}
                >
                  View All Users
                </button>
              </div>

              <div className="admindash-recent-section">
                <h2>Recent Books</h2>
                <table className="admindash-mini-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Author</th>
                      <th>Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentBooks.map(book => (
                      <tr key={book._id}>
                        <td>{book.title}</td>
                        <td>{book.author}</td>
                        <td>
                          {book.reviews && book.reviews.length > 0
                            ? (book.reviews.reduce((sum, review) => sum + review.rating, 0) / book.reviews.length).toFixed(1)
                            : '0.0'} ⭐
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button
                  className="admindash-view-all-button"
                  onClick={() => navigate('/admin/books')}
                >
                  View All Books
                </button>
              </div>

              <div className="admindash-recent-section">
                <h2>Recent Complaints</h2>
                <table className="admindash-mini-table">
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>User</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentComplaints.map(complaint => (
                      <tr key={complaint._id}>
                        <td>{complaint.subject}</td>
                        <td>{complaint.user.name}</td>
                        <td>
                          <span className={`admindash-status-badge ${complaint.status.toLowerCase()}`}>
                            {complaint.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button
                  className="admindash-view-all-button"
                  onClick={() => navigate('/admin/complaints')}
                >
                  View All Complaints
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;