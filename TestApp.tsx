import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

const TestApp: React.FC = () => {
  return (
    <BrowserRouter>
      <div style={{ padding: '20px' }}>
        <h1>Test App - Debugging</h1>
        <nav style={{ marginBottom: '20px' }}>
          <Link to="/" style={{ marginRight: '10px' }}>Home</Link>
          <Link to="/about" style={{ marginRight: '10px' }}>About</Link>
          <Link to="/contact">Contact</Link>
        </nav>

        <Routes>
          <Route path="/" element={<div>Home Page</div>} />
          <Route path="/about" element={<div>About Page</div>} />
          <Route path="/contact" element={<div>Contact Page</div>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default TestApp;