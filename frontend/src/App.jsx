import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';

const ProtectedRoute = ({ children, requireAdmin }) => {
  const { profile, loading, isAdmin } = useContext(AuthContext);
  
  if (loading) return <div className="container mt-8 text-center">Loading...</div>;
  if (!profile) return <Navigate to="/login" />;
  
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/employee" />;
  }
  
  if (!requireAdmin && isAdmin) {
    return <Navigate to="/admin" />;
  }
  
  return children;
};

const AppRoutes = () => {
  const { profile, isAdmin } = useContext(AuthContext);

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={
          profile ? <Navigate to={isAdmin ? '/admin' : '/employee'} /> : <Login />
        } />
        <Route 
          path="/admin/*" 
          element={
            <ProtectedRoute requireAdmin={true}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/employee/*" 
          element={
            <ProtectedRoute requireAdmin={false}>
              <EmployeeDashboard />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
