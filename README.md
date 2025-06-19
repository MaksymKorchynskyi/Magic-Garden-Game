# Magic-Garden Game (FastAPI + React)
A crypto farming simulation game built with Python, where players grow magical plants, harvest them, and earn rewards.

## 🎮 Game Features

### 🌱 Plant & Harvest System
- **Multiple plant types** (Common, Rare, Legendary) with different growth times
- **Real-time growing mechanics** – plants mature over time
- **Harvesting rewards** – earn in-game currency or crypto tokens

### 💰 Crypto & Token Integration
- **Mock cryptocurrency rewards** (can be adapted for real blockchain)
- **Wallet system** – track earnings securely
- **Exchange mechanic** – trade plants for tokens

### 🏆 Player Progression
- **Leveling system** – unlock new plants & bonuses
- **Leaderboard** – compete with other players
- **Daily rewards** – log in to claim bonuses

### ⚙️ Game Mechanics
- **Energy system** – limits actions per day
- **Random events** (e.g., rain boosts growth, pests attack plants)
- **Upgrades** – improve garden efficiency

## 🛠 Technologies Used
- **Backend**:
  - Python (Core game logic)
  - FastAPI (REST API)
  - SQLite (Player progress & plant data storage)
  - Web3.py (For blockchain integration)

- **Frontend**:
  - React.js
  - Tailwind CSS (Styling)
  - Web3.js (Blockchain interactions)

## 🚀 Getting Started
```bash
# Backend setup
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend setup
cd frontend
npm install
npm run dev

Web3.py (if crypto integration is real)

Mock blockchain (For testing crypto features)

