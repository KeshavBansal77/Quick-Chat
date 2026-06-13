# Quick Chat

Quick Chat is a real-time chat application built using the MERN Stack (MongoDB, ExpressJS, ReactJS, NodeJS) with AI-powered features.

## Live Demo

[https://quick-chat-theta-six.vercel.app](https://quick-chat-theta-six.vercel.app)

## Features

- Sign Up / Sign In
- Email Verification
- Forgot / Reset Password
- Dark / Light mode
- One-on-one Chat
- Group Chat (min 3 users)
- AI Chatbot (powered by Groq/Llama)
- Chat Summarization (AI-powered)
- Online / Offline Status
- Chat Theme Customization
- Update Profile Image
- Update Profile Details
- View others profile
- Fully Responsive

## Tech Stack

**Client:** React, Redux, TailwindCSS, styled-components

**Server:** Node, Express, Socket.IO, MongoDB

**AI:** Groq (Llama 3.3 70B)

**Deployment:** Vercel (Frontend), Render (Backend)

## Installation

```bash
git clone https://github.com/YOUR_USERNAME/quick-chat.git
cd quick-chat
```

### Install dependencies

```bash
cd client && npm install
cd ../server && npm install
```

### Configure environment

Create `server/config/dev.js` with your credentials (see `prod.js` for the template).

Create `client/.env`:
```
REACT_APP_SERVER_ACCESS_BASE_URL=http://localhost:4000
```

### Start

```bash
# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Frontend
cd client && npm start
```

## Author

- **Keshav Bansal** — [@KeshavBansal77](https://github.com/KeshavBansal77)

## Feedback

If you have any feedback or suggestions, feel free to reach out.
