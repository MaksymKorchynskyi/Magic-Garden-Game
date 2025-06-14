import React, { useState } from 'react';
import PropTypes from 'prop-types';
import metamaskIcon from './assets/images/metamask-icon.png';
import gmailIcon from './assets/images/gmail-icon.png';
import eyeIcon from './assets/images/eye-icon-open.png';
import eyeClosedIcon from './assets/images/eye-icon-closed.png';

const RegistrationVisual = ({ 
  onRegister, 
  onLogin, 
  onBack, 
  isRegistering, 
  toggleMode,
  isLoading 
}) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    birth_date: '',
    password: '',
    wallet_address: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showWallet, setShowWallet] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isRegistering) {
      onRegister(formData);
    } else {
      onLogin(formData);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>{isRegistering ? 'Create Account' : 'Welcome Back'}</h2>
        <p style={styles.subtitle}>
          {isRegistering ? 'Join our magical garden' : 'Continue your journey'}
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          {isRegistering && (
            <div style={styles.inputGroup}>
              <label style={styles.label}>Username</label>
              <div style={styles.inputContainer}>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Enter your username"
                  style={styles.input}
                  required
                  minLength="3"
                />
              </div>
            </div>
          )}

          <div style={styles.inputGroup}>
            <label style={styles.label}>Email</label>
            <div style={styles.inputContainer}>
              <img src={gmailIcon} alt="Email" style={styles.inputIcon} />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                style={styles.input}
                required
              />
            </div>
          </div>

          {isRegistering && (
            <div style={styles.inputGroup}>
              <label style={styles.label}>Date of Birth</label>
              <div style={styles.inputContainer}>
                <input
                  type="date"
                  name="birth_date"
                  value={formData.birth_date}
                  onChange={handleChange}
                  style={styles.input}
                  required
                />
              </div>
            </div>
          )}

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <div style={styles.inputContainer}>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter password"
                style={styles.input}
                required
                minLength="6"
              />
              <button 
                type="button" 
                style={styles.eyeButton}
                onClick={() => setShowPassword(!showPassword)}
              >
                <img 
                  src={showPassword ? eyeClosedIcon : eyeIcon} 
                  alt="Toggle visibility" 
                  style={styles.eyeIcon}
                />
              </button>
            </div>
          </div>

          {isRegistering && (
            <div style={styles.inputGroup}>
              <label style={styles.label}>Wallet Address</label>
              <div style={styles.inputContainer}>
                <img src={metamaskIcon} alt="Wallet" style={styles.inputIcon} />
                <input
                  type={showWallet ? "text" : "password"}
                  name="wallet_address"
                  value={formData.wallet_address}
                  onChange={handleChange}
                  placeholder="Your crypto wallet"
                  style={styles.input}
                  required
                  minLength="12"
                />
                <button 
                  type="button" 
                  style={styles.eyeButton}
                  onClick={() => setShowWallet(!showWallet)}
                >
                  <img 
                    src={showWallet ? eyeClosedIcon : eyeIcon} 
                    alt="Toggle visibility" 
                    style={styles.eyeIcon}
                  />
                </button>
              </div>
            </div>
          )}

          <button 
            type="submit" 
            style={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? (
              <div style={styles.spinner}></div>
            ) : isRegistering ? (
              'Create Account'
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div style={styles.footer}>
          <p style={styles.footerText}>
            {isRegistering ? 'Already have an account?' : "Don't have an account?"}
            <button 
              type="button" 
              style={styles.toggleButton}
              onClick={toggleMode}
              disabled={isLoading}
            >
              {isRegistering ? 'Sign In' : 'Create Account'}
            </button>
          </p>

          <button 
            type="button" 
            style={styles.backButton}
            onClick={onBack}
            disabled={isLoading}
          >
            Back to Main
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #4a2a6b 0%, #2d1a42 50%, #1a1029 100%)',
    padding: '20px',
  },
  card: {
    backgroundColor: 'rgba(30, 15, 60, 0.9)',
    borderRadius: '20px',
    padding: '40px',
    width: '100%',
    maxWidth: '450px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(123, 61, 255, 0.3)',
  },
  title: {
    color: '#ffffff',
    fontSize: '28px',
    fontWeight: 'bold',
    margin: '0 0 5px 0',
    textAlign: 'center',
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '16px',
    textAlign: 'center',
    margin: '0 0 30px 0',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: '14px',
    fontWeight: '500',
  },
  inputContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  input: {
    padding: '14px 15px 14px 40px',
    borderRadius: '10px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    color: 'white',
    fontSize: '16px',
    outline: 'none',
    transition: 'all 0.3s ease',
    width: '100%',
    ':focus': {
      borderColor: '#7b3dff',
      boxShadow: '0 0 0 2px rgba(123, 61, 255, 0.3)',
    },
  },
  inputIcon: {
    position: 'absolute',
    left: '12px',
    width: '20px',
    height: '20px',
    zIndex: 1,
  },
  eyeButton: {
    position: 'absolute',
    right: '10px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '5px',
  },
  eyeIcon: {
    width: '20px',
    height: '20px',
  },
  submitButton: {
    backgroundColor: '#7b3dff',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    padding: '16px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginTop: '10px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    ':hover': {
      backgroundColor: '#6a30e6',
      transform: 'translateY(-2px)',
    },
    ':disabled': {
      backgroundColor: '#555',
      cursor: 'not-allowed',
      transform: 'none',
    },
  },
  spinner: {
    width: '20px',
    height: '20px',
    border: '3px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '50%',
    borderTopColor: 'white',
    animation: 'spin 1s linear infinite',
  },
  footer: {
    marginTop: '25px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '15px',
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '14px',
    margin: 0,
  },
  toggleButton: {
    backgroundColor: 'transparent',
    color: '#7b3dff',
    border: 'none',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginLeft: '5px',
    padding: '0',
    textDecoration: 'underline',
    ':disabled': {
      opacity: 0.6,
      cursor: 'not-allowed',
    },
  },
  backButton: {
    backgroundColor: 'transparent',
    color: 'rgba(255, 255, 255, 0.7)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '8px',
    padding: '10px 20px',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    ':hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    ':disabled': {
      opacity: 0.6,
      cursor: 'not-allowed',
    },
  },
  '@keyframes spin': {
    '0%': { transform: 'rotate(0deg)' },
    '100%': { transform: 'rotate(360deg)' },
  },
};

RegistrationVisual.propTypes = {
  onRegister: PropTypes.func.isRequired,
  onLogin: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
  isRegistering: PropTypes.bool.isRequired,
  toggleMode: PropTypes.func.isRequired,
  isLoading: PropTypes.bool.isRequired,
};

export default RegistrationVisual;