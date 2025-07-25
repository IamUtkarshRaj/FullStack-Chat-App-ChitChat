# ChitChat - Full Stack Chat App

Welcome to **ChitChat**, a modern full stack chat application built for real-time communication! This project demonstrates a complete chat solution using the JavaScript ecosystem, featuring a responsive UI and powerful backend capabilities.

---

## 🚀 Features

- **Real-time Messaging**: Seamless, instant messaging between users.
- **User Authentication**: Secure sign-up and login functionality.
- **One-to-One Chats**: Start private conversations chats.
- **Online Status Indicators**: See who's online in real time.
- **Message Notifications**: Get notified of new messages.
- **Media Support**: Send images, emojis, and more.
- **Responsive Design**: Works great on both desktop and mobile devices.

---

## 🛠️ Tech Stack

- **Frontend**: React.js (for UI and client logic)
- **Backend**: Node.js with Express
- **Database**: MongoDB (via Mongoose)
- **Real-time Communication**: Socket.io
- **Authentication**: JWT (JSON Web Tokens)
- **Styling**: CSS Modules / Tailwind CSS / Styled Components / DaisyUI 

---

## 📦 Folder Structure

```
/frontend           # Frontend code (React + Vite)
  /src
    /components   # Reusable UI components
    /pages        # App views/pages
    /utils        # Helper functions
    /lib
    /store

/backend         # Backend code (Node.js + Express)
  /src
    /controllers    # Route controllers
    /models         # Mongoose models
    /routes         # API routes
    /middleware
    /config         # DB and server configs
    /sockets        # Socket.io logic
```

---

## ⚡ How It Works

1. **User Signup/Login**  
   Users register or sign in. Authentication tokens are used to secure API requests.

2. **Chat Creation**  
   Users can start a private chat or create a group conversation.

3. **Real-Time Messaging**  
   Messages are sent instantly via Socket.io and stored in MongoDB.

4. **Presence & Notifications**  
   The app tracks user online status and triggers real-time notifications for new messages.

---

## 🖥️ Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/IamUtkarshRaj/FullStack-Chat-App-ChitChat.git
cd FullStack-Chat-App-ChitChat
```

### 2. Install Dependencies

Install server and client dependencies:

```bash
cd backend
npm install
cd ../frontend
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the `/backend` directory and add your MongoDB URI and JWT secret:

```env
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_secret_key
```

### 4. Run the App

Start backend and frontend servers:

```bash
# In /backend
npm run dev

# In /frontend (new terminal)
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## 📸 Screenshots

> _Add screenshots or GIFs here to showcase UI and features_

---

## 🤝 Contributions

Pull requests are welcome! For major changes, please open an issue first to discuss your ideas.

---

## 📄 License

Distributed under the MIT License.

---

### Made with ❤️ by [IamUtkarshRaj](https://github.com/IamUtkarshRaj)
