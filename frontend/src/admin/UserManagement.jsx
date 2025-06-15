import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdminDashboard.css';

const UserManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [roleUpdateMode, setRoleUpdateMode] = useState(false);
  const [newRole, setNewRole] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get('http://localhost:5000/admin/users', {
        headers: {
          'x-auth-token': token
        }
      });

      if (response.data.status === 'success') {
        setUsers(response.data.data);
      } else {
        setError('Failed to load users');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Error loading users');
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.put(
        `http://localhost:5000/admin/users/${userId}/role`,
        { role: newRole },
        {
          headers: {
            'x-auth-token': token
          }
        }
      );

      if (response.data.status === 'success') {
        // Update users list
        setUsers(users.map(user => 
          user._id === userId ? { ...user, role: newRole } : user
        ));
        setRoleUpdateMode(false);
        setSelectedUser(null);
      } else {
        setError('Failed to update user role');
      }
    } catch (err) {
      console.error('Error updating role:', err);
      setError('Error updating user role');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const token = localStorage.getItem('token');
        
        const response = await axios.delete(
          `http://localhost:5000/admin/users/${userId}`,
          {
            headers: {
              'x-auth-token': token
            }
          }
        );

        if (response.data.status === 'success') {
          // Remove user from list
          setUsers(users.filter(user => user._id !== userId));
        } else {
          setError('Failed to delete user');
        }
      } catch (err) {
        console.error('Error deleting user:', err);
        setError('Error deleting user');
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
            className="nav-item active"
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
          <h1>User Management</h1>
        </div>
        
        <div className="admin-main">
          {error && <div className="error-message">{error}</div>}
          
          {loading ? (
            <div className="loading">Loading users...</div>
          ) : (
            <div className="users-table-container">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Created At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user._id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.role}</td>
                      <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td>
                        {selectedUser === user._id && roleUpdateMode ? (
                          <div className="role-update-controls">
                            <select
                              value={newRole}
                              onChange={(e) => setNewRole(e.target.value)}
                              className="role-select"
                            >
                              <option value="">Select Role</option>
                              <option value="user">User</option>
                              <option value="admin">Admin</option>
                            </select>
                            <button 
                              onClick={() => handleUpdateRole(user._id)}
                              className="save-button"
                              disabled={!newRole}
                            >
                              Save
                            </button>
                            <button 
                              onClick={() => {
                                setRoleUpdateMode(false);
                                setSelectedUser(null);
                              }}
                              className="cancel-button"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="user-actions">
                            <button 
                              onClick={() => {
                                setSelectedUser(user._id);
                                setRoleUpdateMode(true);
                                setNewRole(user.role);
                              }}
                              className="edit-button"
                            >
                              Change Role
                            </button>
                            <button 
                              onClick={() => handleDeleteUser(user._id)}
                              className="delete-button"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManagement;