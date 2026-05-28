import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { getRequestErrorMessage } from '../utils/httpError';

const AuthContext = createContext(null);

// Configure axios to include credentials (cookies) with all requests
axios.defaults.withCredentials = true;

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if admin is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // First try to get token from localStorage (for Authorization header)
        const token = localStorage.getItem('token');
        
        if (token) {
          // Set Authorization header for subsequent requests
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
          // No token, skip auth check
          setLoading(false);
          return;
        }

        // Try to fetch profile to verify authentication
        const response = await axios.get('/api/auth/profile');
        
        if (response.data.success) {
          setAdmin(response.data.data.admin);
          setIsAuthenticated(true);
        } else {
          // Clear invalid token
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
        }
      } catch (error) {
        // Not authenticated or error - this is normal if no valid token
        // Only log if it's not a 401 (which is expected for invalid/expired tokens)
        if (error.response?.status !== 401) {
          console.log('Auth check error:', error.message);
        }
        // Clear any invalid token
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = useCallback(async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      
      if (response.data.success) {
        const { admin: adminData, token } = response.data.data;
        
        // Store token in localStorage for Authorization header
        localStorage.setItem('token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Set admin state
        setAdmin(adminData);
        setIsAuthenticated(true);
        
        return { success: true, admin: adminData };
      }
    } catch (error) {
      const message = getRequestErrorMessage(error, 'Login failed');
      return { success: false, error: message };
    }
  }, []);

  // Register function (for creating initial admin)
  const register = useCallback(async (username, email, password) => {
    try {
      const response = await axios.post('/api/auth/register', { 
        username, 
        email, 
        password 
      });
      
      if (response.data.success) {
        const { admin: adminData, token } = response.data.data;
        
        // Store token in localStorage
        localStorage.setItem('token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Set admin state
        setAdmin(adminData);
        setIsAuthenticated(true);
        
        return { success: true, admin: adminData };
      }
    } catch (error) {
      const message = getRequestErrorMessage(error, 'Registration failed');
      return { success: false, error: message };
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      // Call logout endpoint to clear cookies
      await axios.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error.message);
    } finally {
      // Always clear local state
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      setAdmin(null);
      setIsAuthenticated(false);
    }
  }, []);

  // Update profile
  const updateProfile = useCallback(async (data) => {
    try {
      const response = await axios.put('/api/auth/profile', data);
      
      if (response.data.success) {
        setAdmin(response.data.data.admin);
        return { success: true, admin: response.data.data.admin };
      }
    } catch (error) {
      const message = getRequestErrorMessage(error, 'Update failed');
      return { success: false, error: message };
    }
  }, []);

  // Change password
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    try {
      const response = await axios.put('/api/auth/password', {
        currentPassword,
        newPassword
      });
      
      if (response.data.success) {
        return { success: true };
      }
    } catch (error) {
      const message = getRequestErrorMessage(error, 'Password change failed');
      return { success: false, error: message };
    }
  }, []);

  const value = {
    admin,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}
