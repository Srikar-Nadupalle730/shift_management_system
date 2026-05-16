import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, profile, isAdmin } = useContext(AuthContext);
  const navigate = useNavigate();

  // Redirect after profile loads post-login
  useEffect(() => {
    if (profile) {
      navigate(isAdmin ? '/admin' : '/employee');
    }
  }, [profile, isAdmin, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      // The useEffect above handles navigation once profile is set
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="hero-section animate-fade-in">
      <div className="container flex justify-center">
        <div className="card w-full" style={{ maxWidth: '450px', padding: '3rem', borderTop: '4px solid var(--primary)' }}>
          <div className="text-center mb-8">
            <div className="navbar-brand justify-center mb-4" style={{ fontSize: '2.5rem' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              SMS
            </div>
            <h2 style={{ fontSize: '1.5rem', opacity: 0.9 }}>Welcome Back</h2>
            <p className="text-muted">Enter your credentials to access your dashboard</p>
          </div>

          {error && <div className="alert alert-danger text-center animate-fade-in">{error}</div>}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="form-group">
              <label className="form-label">Email / User ID</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="name@company.com"
                  style={{ paddingLeft: '2.5rem' }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>👤</span>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  className="form-control"
                  style={{ paddingLeft: '2.5rem' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔒</span>
              </div>
            </div>
            <button type="submit" className="btn btn-primary w-full mt-4" style={{ padding: '1rem', fontSize: '1.1rem' }}>
              Sign In
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-muted" style={{ fontSize: '0.9rem' }}>
              Forgot password? Please contact your Administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
