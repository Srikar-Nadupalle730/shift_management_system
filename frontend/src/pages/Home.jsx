import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="hero-section animate-fade-in">
      <div className="hero-content">
        <h1 className="hero-title">Shift Management System</h1>
        <p className="text-muted mb-8" style={{ fontSize: '1.25rem' }}>
          Streamline your workforce scheduling with Shift Management System. Automated rotational shifts, dedicated dashboards for admins and employees, and beautiful design.
        </p>
        <div className="tech-stack-container mt-8">
          <h2 className="tech-stack-title mb-8">Powering the System</h2>
          <div className="tech-grid">
            <div className="tech-card">
              <div className="tech-icon-wrapper">
                <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" alt="React" />
              </div>
              <h3>React</h3>
              <p>Frontend Library</p>
            </div>
            <div className="tech-card">
              <div className="tech-icon-wrapper">
                <img src="https://vitejs.dev/logo.svg" alt="Vite" />
              </div>
              <h3>Vite</h3>
              <p>Build Tool</p>
            </div>
            <div className="tech-card">
              <div className="tech-icon-wrapper">
                <img src="http://127.0.0.1:8000/assets/frappe/images/frappe-framework-logo.svg" alt="Frappe" />
              </div>
              <h3>Frappe</h3>
              <p>Backend Framework</p>
            </div>
            <div className="tech-card">
              <div className="tech-icon-wrapper">
                <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg" alt="Python" />
              </div>
              <h3>Python</h3>
              <p>Logic Layer</p>
            </div>
            <div className="tech-card">
              <div className="tech-icon-wrapper">
                <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mariadb/mariadb-original.svg" alt="MariaDB" />
              </div>
              <h3>MariaDB</h3>
              <p>Database</p>
            </div>
            <div className="tech-card">
              <div className="tech-icon-wrapper">
                <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg" alt="CSS3" />
              </div>
              <h3>Modern CSS</h3>
              <p>Styling</p>
            </div>
            <div className="tech-card">
              <div className="tech-icon-wrapper">
                <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg" alt="HTML5" />
              </div>
              <h3>HTML5</h3>
              <p>Structure</p>
            </div>
            <div className="tech-card">
              <div className="tech-icon-wrapper">
                <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg" alt="JavaScript" />
              </div>
              <h3>JavaScript</h3>
              <p>Client Logic</p>
            </div>
          </div>
        </div>
        <div className="flex justify-center gap-4">
          <Link to="/login" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.2rem' }}>
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
