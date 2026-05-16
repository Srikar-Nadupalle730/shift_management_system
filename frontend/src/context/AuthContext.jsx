import React, { createContext, useState, useEffect } from 'react';
import { getLoggedInUser, getEmployeeProfile, login as apiLogin, logout as apiLogout } from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Initial check disabled to prevent auto-login
  useEffect(() => {
    // checkUser(); // Commented out as per user request to prevent any auto-login
    setLoading(false);
  }, []);

  const checkUser = async () => {
    try {
      const res = await getLoggedInUser();
      if (res.data.message && res.data.message !== 'Guest') {
        const email = res.data.message;
        setUser({ email });
        
        if (email === 'Administrator') {
          setIsAdmin(true);
          setProfile({ first_name: 'Administrator', email: 'Administrator', isAdmin: true });
        } else {
          // Fetch custom profile
          const emp = await getEmployeeProfile(email);
          if (emp) {
            setProfile(emp);
            setIsAdmin(false);
          }
        }
      }
    } catch (err) {
      console.log('Not logged in');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    await apiLogin(email, password);
    await checkUser();
  };

  const logout = async () => {
    await apiLogout();
    setUser(null);
    setProfile(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
