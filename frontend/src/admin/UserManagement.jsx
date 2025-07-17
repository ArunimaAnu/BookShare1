import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './UserManagement.css';

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
      const response = await axios.patch(
        `http://localhost:5000/admin/users/${userId}/role`,
        { role: newRole },
        { headers: { 'x-auth-token': token } }
      );

      if (response.data.status === 'success') {
        setUsers(users.map(user => 
          user._id === userId ? { ...user, role: newRole } : user
        ));
        setRoleUpdateMode(false);
        setNewRole('');
      }
    } catch (err) {
      console.error('Error updating user role:', err);
      setError('Failed to update user role');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(
        `http://localhost:5000/admin/users/${userId}`,
        { headers: { 'x-auth-token': token } }
      );

      if (response.data.status === 'success') {
        setUsers(users.filter(user => user._id !== userId));
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

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
            className="admindash-nav-item active"
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
          <h1>User Management</h1>
        </div>

        <div className="admindash-main">
          {error && <div className="admindash-error">{error}</div>}

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
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user._id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>
                        {roleUpdateMode && selectedUser === user._id ? (
                          <select
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value)}
                          >
                            <option value="">Select Role</option>
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        ) : (
                          <span className={`user-role ${user.role}`}>{user.role}</span>
                        )}
                      </td>
                     
                      <td>
                        <div className="user-actions">
                          {roleUpdateMode && selectedUser === user._id ? (
                            <>
                              <button
                                onClick={() => handleUpdateRole(user._id)}
                                className="user-action-button save-role"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => {
                                  setRoleUpdateMode(false);
                                  setSelectedUser(null);
                                  setNewRole('');
                                }}
                                className="user-action-button cancel"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              {/* <button
                                onClick={() => {
                                  setRoleUpdateMode(true);
                                  setSelectedUser(user._id);
                                  setNewRole(user.role);
                                }}
                                className="user-action-button change-role"
                              >
                                Change Role
                              </button>                               */}
                              <button
                                onClick={() => handleDeleteUser(user._id)}
                                className="user-action-button delete"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
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