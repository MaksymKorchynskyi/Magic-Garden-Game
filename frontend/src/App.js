import React, { useState, useEffect } from 'react';
import axios from 'axios';
import gardenImage from './assets/images/mag3garden.png';
import GameAction from './GameAction';
import RegistrationVisual from './RegistrationVisual';
import eyeIcon from './assets/images/eye-icon-open.png';
import eyeClosedIcon from './assets/images/eye-icon-closed.png';
import gmailIcon from './assets/images/gmail-icon.png';
import metamaskIcon from './assets/images/metamask-icon.png';
import defaultAvatar from './assets/images/avatar_default.png';

const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:8000' 
  : 'https://magic-garden-game-production.up.railway.app/'; 

function App() {
  const [showGame, setShowGame] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hoverPlay, setHoverPlay] = useState(false);
  const [showWalletAddress, setShowWalletAddress] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.expand();
      tg.ready();
      
      if (tg.initDataUnsafe?.user) {
        const tgUser = {
          id: tg.initDataUnsafe.user.id.toString(),
          username: tg.initDataUnsafe.user.username || `user_${tg.initDataUnsafe.user.id}`,
          level: 1,
          coins: 0,
          avatar: tg.initDataUnsafe.user.photo_url || defaultAvatar
        };
        setUserData(tgUser);
        handleTelegramAuth(tgUser);
      }
    }
  }, []);

  const handleTelegramAuth = async (tgUser) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/register`, {
        username: tgUser.username,
        email: `${tgUser.id}@telegram.user`,
        password: `tg_${tgUser.id}_secret`,
        birth_date: '2000-01-01',
        wallet_address: `tg${tgUser.id}wallet`,
        telegram_id: parseInt(tgUser.id),
        avatar: tgUser.avatar
      });
      
      if (response.data.id) {
        setUserData({
          ...tgUser,
          ...response.data,
          avatar: response.data.avatar || tgUser.avatar
        });
      }
    } catch (error) {
      console.error('Telegram auth error:', error);
    }
  };

  const handleRegister = async (formData) => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/register`, {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        birth_date: formData.birth_date,
        wallet_address: formData.wallet_address,
      });

      if (response.data.id) {
        setUserData({
          ...response.data,
          avatar: defaultAvatar
        });
        setShowAuth(false);
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert(error.response?.data?.detail || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (formData) => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/login`, {
        email: formData.email,
        password: formData.password
      });

      if (response.data.id) {
        setUserData({
          ...response.data,
          avatar: response.data.avatar || defaultAvatar
        });
        setShowAuth(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      alert(error.response?.data?.detail || "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setUserData(null);
    setShowProfile(false);
  };

  const updateUserData = (newData) => {
    setUserData(prev => ({
      ...prev,
      ...newData
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const formData = new FormData(e.target);
      const response = await axios.put(`${API_BASE_URL}/api/user/${userData.id}`, {
        username: formData.get('username'),
        password: formData.get('password') || undefined,
        birth_date: formData.get('birth_date'),
        wallet_address: formData.get('wallet_address'),
        avatar: avatarPreview || userData.avatar
      });

      if (response.data.id) {
        setUserData({
          ...userData,
          username: response.data.username,
          birth_date: response.data.birth_date,
          wallet_address: response.data.wallet_address,
          avatar: avatarPreview || response.data.avatar || userData.avatar
        });
        setAvatarPreview(null);
        setShowEditProfile(false);
        setShowProfile(true);
      }
    } catch (error) {
      console.error('Update error:', error);
      alert(error.response?.data?.detail || "Update failed");
    } finally {
      setIsLoading(false);
    }
  };

  const maskWalletAddress = (address) => {
    if (!address) return '';
    if (address.length <= 8) return address;
    return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
  };

  const toggleAuthMode = () => {
    setIsRegistering(prev => !prev);
  };

  return (
    <div style={styles.container}>
      {showAuth ? (
        <RegistrationVisual
          onRegister={handleRegister}
          onLogin={handleLogin}
          onBack={() => setShowAuth(false)}
          isRegistering={isRegistering}
          toggleMode={toggleAuthMode}
          isLoading={isLoading}
        />
      ) : showGame ? (
        <GameAction 
          userData={userData} 
          onBack={() => setShowGame(false)}
          onUpdateUser={updateUserData}
          apiBaseUrl={API_BASE_URL}
        />
      ) : showProfile ? (
        <div style={styles.profileContainer}>
          <div style={styles.profileHeader}>
            <h2 style={styles.profileTitle}>Profile</h2>
            <button 
              style={styles.closeButton}
              onClick={() => setShowProfile(false)}
            >
              ×
            </button>
          </div>

          <div style={styles.avatarSection}>
            <img 
              src={userData.avatar || defaultAvatar} 
              alt="Avatar" 
              style={styles.profileAvatar}
            />
          </div>

          <div style={styles.profileInfo}>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Username:</span>
              <span style={styles.infoValue}>{userData.username}</span>
            </div>

            {userData.email && (
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>
                  <img src={gmailIcon} alt="Email" style={styles.infoIcon} />
                  Email:
                </span>
                <span style={styles.infoValue}>{userData.email}</span>
              </div>
            )}

            {userData.birth_date && (
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Birth Date:</span>
                <span style={styles.infoValue}>
                  {new Date(userData.birth_date).toLocaleDateString()}
                </span>
              </div>
            )}

            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>
                <img src={metamaskIcon} alt="Wallet" style={styles.infoIcon} />
                Wallet:
              </span>
              <span style={styles.infoValue}>
                {showWalletAddress ? userData.wallet_address : maskWalletAddress(userData.wallet_address)}
                <button 
                  style={styles.eyeButton}
                  onClick={() => setShowWalletAddress(!showWalletAddress)}
                >
                  <img 
                    src={showWalletAddress ? eyeClosedIcon : eyeIcon} 
                    alt="Toggle visibility" 
                    style={styles.eyeIcon}
                  />
                </button>
              </span>
            </div>

            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Level:</span>
              <span style={styles.infoValue}>{userData.level}</span>
            </div>

            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Coins:</span>
              <span style={styles.infoValue}>{userData.coins}</span>
            </div>

            {userData.telegram_id && (
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Telegram ID:</span>
                <span style={styles.infoValue}>{userData.telegram_id}</span>
              </div>
            )}
          </div>

          <div style={styles.profileButtons}>
            <button 
              style={styles.editButton}
              onClick={() => {
                setShowEditProfile(true);
                setShowProfile(false);
              }}
            >
              Edit Profile
            </button>
            <button 
              style={styles.logoutButton}
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>
      ) : showEditProfile ? (
        <div style={styles.editProfileContainer}>
          <div style={styles.profileHeader}>
            <h2 style={styles.profileTitle}>Edit Profile</h2>
            <button 
              style={styles.closeButton}
              onClick={() => {
                setShowEditProfile(false);
                setShowProfile(true);
                setAvatarPreview(null);
              }}
            >
              ×
            </button>
          </div>

          <form onSubmit={handleProfileUpdate} style={styles.editForm}>
            <div style={styles.avatarUpload}>
              <img 
                src={avatarPreview || userData.avatar || defaultAvatar} 
                alt="Avatar preview" 
                style={styles.avatarPreview}
              />
              <label style={styles.avatarLabel}>
                Change Avatar
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={styles.avatarInput}
                />
              </label>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Username</label>
              <input
                type="text"
                name="username"
                defaultValue={userData.username}
                placeholder="New username"
                style={styles.input}
                required
                minLength="3"
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                name="password"
                placeholder="New password (leave blank to keep current)"
                style={styles.input}
                minLength="6"
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Birth Date</label>
              <input
                type="date"
                name="birth_date"
                defaultValue={userData.birth_date}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Wallet Address</label>
              <input
                type="text"
                name="wallet_address"
                defaultValue={userData.wallet_address}
                placeholder="New wallet address"
                style={styles.input}
                required
                minLength="12"
              />
            </div>

            <div style={styles.buttonGroup}>
              <button 
                type="button" 
                style={styles.cancelButton}
                onClick={() => {
                  setShowEditProfile(false);
                  setShowProfile(true);
                  setAvatarPreview(null);
                }}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                style={styles.saveButton}
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div style={styles.content}>
          <header style={styles.header}>
            <h1 style={styles.logo}>Luthenia</h1>
            {userData ? (
              <div 
                style={styles.profileButton} 
                onClick={() => setShowProfile(true)}
              >
                <img 
                  src={userData.avatar || defaultAvatar} 
                  alt="Avatar" 
                  style={styles.userAvatar}
                />
                <span style={styles.usernameText}>{userData.username}</span>
              </div>
            ) : (
              <button 
                style={styles.loginButton}
                onClick={() => {
                  setShowAuth(true);
                  setIsRegistering(false);
                }}
              >
                Login
              </button>
            )}
          </header>
          
          <div style={styles.mainContent}>
            <div style={styles.imageWrapper}>
              <img 
                src={gardenImage} 
                alt="Magical garden" 
                style={styles.seamlessImage}
              />
            </div>
            
            <div style={styles.divider} />
            <h2 style={styles.subtitle}>Grow your magical garden</h2>
            <p style={styles.description}>Upgrade and harvest mystical crops</p>
            <button 
              style={{
                ...styles.playButton,
                boxShadow: hoverPlay 
                  ? '0 0 10px #7b3dff, 0 0 20px #7b3dff, 0 0 30px #7b3dff'
                  : '0 0 5px #7b3dff',
                transition: 'all 0.3s ease'
              }} 
              onClick={() => {
                if (!userData) {
                  setShowAuth(true);
                  setIsRegistering(true);
                } else {
                  setShowGame(true);
                }
              }}
              onMouseEnter={() => setHoverPlay(true)}
              onMouseLeave={() => setHoverPlay(false)}
            >
              {userData ? 'Play Game' : 'Register to Play'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    padding: "20px",
    color: "white",
    fontFamily: "'Arial', sans-serif",
    background: "linear-gradient(135deg, #4a2a6b 0%, #2d1a42 50%, #1a1029 100%)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: "40px",
  },
  logo: {
    fontSize: "28px",
    fontWeight: "bold",
    margin: 0,
    color: "#ffffff",
    textShadow: "0 0 10px #7b3dff",
  },
  loginButton: {
    backgroundColor: "transparent",
    color: "white",
    border: "1px solid rgba(255, 255, 255, 0.3)",
    borderRadius: "20px",
    padding: "10px 20px",
    fontSize: "14px",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "all 0.3s ease",
    ':hover': {
      backgroundColor: "rgba(255, 255, 255, 0.1)",
    },
  },
  profileButton: {
    backgroundColor: "rgba(123, 61, 255, 0.2)",
    color: "white",
    border: "1px solid #7b3dff",
    borderRadius: "20px",
    padding: "8px 15px",
    fontSize: "14px",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    ':hover': {
      backgroundColor: "rgba(123, 61, 255, 0.4)",
    }
  },
  userAvatar: {
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "1px solid #7b3dff",
  },
  usernameText: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    maxWidth: "100px",
  },
  profileContainer: {
    maxWidth: "400px",
    margin: "0 auto",
    padding: "25px",
    backgroundColor: "rgba(30, 15, 60, 0.9)",
    borderRadius: "20px",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
    border: "1px solid rgba(123, 61, 255, 0.3)",
  },
  profileHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  profileTitle: {
    fontSize: "24px",
    margin: 0,
    color: "#ffffff",
  },
  closeButton: {
    backgroundColor: "transparent",
    color: "rgba(255, 255, 255, 0.7)",
    border: "none",
    fontSize: "24px",
    cursor: "pointer",
    padding: "5px 10px",
    borderRadius: "50%",
    ':hover': {
      backgroundColor: "rgba(255, 255, 255, 0.1)",
    },
  },
  avatarSection: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "20px",
  },
  profileAvatar: {
    width: "100px",
    height: "100px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "3px solid #7b3dff",
    boxShadow: "0 0 15px rgba(123, 61, 255, 0.5)",
  },
  profileInfo: {
    marginBottom: "25px",
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 0",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
  },
  infoLabel: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  infoValue: {
    color: "white",
    fontSize: "14px",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "5px",
  },
  infoIcon: {
    width: "16px",
    height: "16px",
  },
  eyeButton: {
    backgroundColor: "transparent",
    border: "none",
    cursor: "pointer",
    padding: "3px",
    display: "flex",
    alignItems: "center",
  },
  eyeIcon: {
    width: "16px",
    height: "16px",
  },
  profileButtons: {
    display: "flex",
    gap: "12px",
  },
  editButton: {
    backgroundColor: "#7b3dff",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "12px",
    fontSize: "16px",
    cursor: "pointer",
    flex: 1,
    transition: "all 0.3s ease",
    ':hover': {
      backgroundColor: "#6a30e6",
    },
  },
  logoutButton: {
    backgroundColor: "#ff3d3d",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "12px",
    fontSize: "16px",
    cursor: "pointer",
    flex: 1,
    transition: "all 0.3s ease",
    ':hover': {
      backgroundColor: "#e63030",
    },
  },
  editProfileContainer: {
    maxWidth: "400px",
    margin: "0 auto",
    padding: "25px",
    backgroundColor: "rgba(30, 15, 60, 0.9)",
    borderRadius: "20px",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
    border: "1px solid rgba(123, 61, 255, 0.3)",
  },
  editForm: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  avatarUpload: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "15px",
    marginBottom: "15px",
  },
  avatarPreview: {
    width: "100px",
    height: "100px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "3px solid #7b3dff",
  },
  avatarLabel: {
    backgroundColor: "rgba(123, 61, 255, 0.3)",
    color: "white",
    border: "1px dashed #7b3dff",
    borderRadius: "8px",
    padding: "10px 15px",
    fontSize: "14px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    textAlign: "center",
    ':hover': {
      backgroundColor: "rgba(123, 61, 255, 0.5)",
    },
  },
  avatarInput: {
    display: "none",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: "14px",
  },
  input: {
    padding: "12px 15px",
    borderRadius: "10px",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    color: "white",
    fontSize: "16px",
    outline: "none",
    transition: "all 0.3s ease",
    ':focus': {
      borderColor: "#7b3dff",
      boxShadow: "0 0 0 2px rgba(123, 61, 255, 0.3)",
    },
  },
  buttonGroup: {
    display: "flex",
    gap: "12px",
    marginTop: "15px",
  },
  cancelButton: {
    backgroundColor: "transparent",
    color: "white",
    border: "1px solid rgba(255, 255, 255, 0.3)",
    borderRadius: "8px",
    padding: "12px",
    fontSize: "16px",
    cursor: "pointer",
    flex: 1,
    transition: "all 0.3s ease",
    ':hover': {
      backgroundColor: "rgba(255, 255, 255, 0.1)",
    },
  },
  saveButton: {
    backgroundColor: "#7b3dff",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "12px",
    fontSize: "16px",
    cursor: "pointer",
    flex: 1,
    transition: "all 0.3s ease",
    ':hover': {
      backgroundColor: "#6a30e6",
    },
    ':disabled': {
      backgroundColor: "#555",
      cursor: "not-allowed",
    },
  },
  content: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    height: "100%",
  },
  mainContent: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    width: "100%",
  },
  imageWrapper: {
    width: "80%",
    maxWidth: "400px",
    margin: "0 auto 20px",
    overflow: "hidden",
  },
  seamlessImage: {
    width: "100%",
    height: "auto",
    display: "block",
    objectFit: "cover",
    border: "none",
    boxShadow: "none",
    filter: "brightness(0.9) contrast(1.1)",
  },
  divider: {
    width: "80%",
    height: "1px",
    background: "linear-gradient(to right, transparent, rgba(255,255,255,0.3), transparent)",
    margin: "20px 0",
  },
  subtitle: {
    fontSize: "28px",
    fontWeight: "bold",
    margin: "0 0 10px 0",
    color: "#ffffff",
  },
  description: {
    fontSize: "16px",
    margin: "0 0 30px 0",
    color: "rgba(255, 255, 255, 0.8)",
    maxWidth: "300px",
    lineHeight: "1.5",
  },
  playButton: {
    backgroundColor: "#7b3dff",
    color: "white",
    border: "none",
    borderRadius: "25px",
    padding: "14px 45px",
    fontSize: "18px",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "all 0.3s ease",
    marginTop: "10px",
    ':hover': {
      backgroundColor: "#6a30e6",
      transform: "translateY(-2px)",
    },
  },
};

export default App;
