# 🔧 Combo Milan — Phone Spare Parts Compatibility Checker

<p align="center">
  <img src="https://img.shields.io/badge/status-MVP%20Complete-brightgreen" />
  <img src="https://img.shields.io/badge/backend-FastAPI-009688" />
  <img src="https://img.shields.io/badge/database-MongoDB-47A248" />
  <img src="https://img.shields.io/badge/tested-11%2F11%20backend-blue" />
</p>

**Combo Milan** is a dark, workshop-style mobile app built for phone repair technicians to instantly check which spare parts are interchangeable across different phone models — no more guesswork, no more wasted parts.

---

## 📱 What It Does

Repair technicians often know from experience that "Model A's screen = Model B's screen," but that knowledge is scattered across WhatsApp groups, sticky notes, and memory. Combo Milan turns that tribal knowledge into a searchable, community-verified database that syncs live across every technician using the app.

---

## ✨ Features

### 🔍 Browse & Search
- **9 part categories**, including a nested **Curve Glass** sub-section
- **Brand groups** (Redmi/Poco, Vivo/iQoo, etc.) with live entry counts
- **Universal search** across brand, model, part, category, and source — auto-opens and jumps straight to the matching entry

### 🧩 Compatibility Cards
- Clear **"Model A = Model B"** compatibility mappings with source attribution
- **Teal verified stamp** for confirmed entries
- Shared **Confirm button** — increments a live count visible to all users
- **Suggest-a-correction** bottom sheet for community-driven accuracy, saved to a pending-review queue

### 🛠️ Extras
- 🌐 **Hindi/English toggle** (model names always stay in English for consistency)
- 🔒 **Passcode-gated Admin panel** for adding new data
- ⚡ **Voltage Divider Calculator** — a handy on-the-go tool for technicians
- 📊 **Export to Excel** — download the full compatibility database anytime

### ☁️ Real-Time Sync
- Full **FastAPI + MongoDB** backend keeps confirm counts and compatibility data synchronized across every user, in real time

---

## 🏗️ Tech Stack

| Layer      | Technology              |
|------------|--------------------------|
| Frontend   | React Native (Expo)      |
| Backend    | FastAPI (Python)         |
| Database   | MongoDB                  |
| Testing    | 11/11 backend tests passing, full frontend flow verification |

---

## 🚀 Getting Started

### Prerequisites
- Node.js & npm/yarn
- Python 3.9+
- MongoDB instance (local or cloud)
- Expo Go app (for mobile testing)

### Installation

```bash
# Clone the repository
git clone https://github.com/<your-username>/combo-milan.git
cd combo-milan

# Backend setup
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend setup
cd ../frontend
npm install
npx expo start
```

### Running on Your Phone
Scan the QR code shown after running `npx expo start` using the **Expo Go** app to launch Combo Milan on your device.

> ⚠️ Note: Some native features are only available in a full iOS/Android build, not in Expo Go preview.

---

## 🗺️ Roadmap

- [ ] **Approve Corrections** — admin screen to approve/reject pending correction suggestions before they go live
- [ ] **Edit Entries** — allow admins to edit or remove existing compatibility groups
- [ ] **Bulk Import** — paste or upload a spreadsheet to add hundreds of compatibility groups at once
- [ ] **Brand Logos** — display real brand logos per section for faster navigation

---

## 📦 Data

The app ships with an **empty database**, ready for technicians and admins to populate with real, verified compatibility data via the Admin panel.

---

## 🤝 Contributing

Contributions, corrections, and new compatibility data are welcome! Use the in-app **Suggest-a-correction** feature, or open a pull request with your changes.

---

## 📄 License

This project is open for educational and competition use. Add your preferred license here (e.g., MIT).

---

<p align="center">Built with ❤️ for the phone repair community</p>

