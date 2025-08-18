// src/auth.js
import jwtDecode from 'jwt-decode';

export const saveAuth = (data) => {
  localStorage.setItem('auth', JSON.stringify(data));
};

export const getAuth = () => {
  const stored = localStorage.getItem('auth');
  return stored ? JSON.parse(stored) : null;
};

export const logout = () => {
  localStorage.removeItem('auth');
};

// ✅ New helper function
export const getUsernameFromToken = () => {
  const auth = getAuth();
  const token = auth?.access; // or 'access_token' depending on your structure
  if (!token) return null;

  try {
    const decoded = jwtDecode(token);
    return decoded.username || decoded.name || decoded.user || null;
  } catch (err) {
    console.error("Error decoding token:", err);
    return null;
  }
};
