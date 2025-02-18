import React from 'react';
import { Link } from 'react-router-dom';
import '../Styles/WelcomePage.css';

const WelcomePage = () => {
  return (
    <div className="welcome-container">
      <div className="welcome-content">
        <h1>Добро пожаловать!</h1>
        <p>Ваше здоровье - наш главный приоритет.</p>
      </div>
    </div>
  );
};

export default WelcomePage;