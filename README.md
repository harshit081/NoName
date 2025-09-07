# Katlio - Real-time Chat Application

A modern, dark-mode-focused real-time chat application built with Next.js, Express.js, Socket.io, and MongoDB Cloud.

## Features

- **Real-time messaging** with Socket.io
- **Public chat rooms** with multiple participants
- **Private one-to-one messaging**
- **Group chat rooms**
- **Typing indicators** and **read receipts**
- **File and image uploads** (up to 25MB)
- **Dark mode UI** with responsive design
- **Mobile-friendly** interface
- **User presence** indicators
- **Chat history** persistence with MongoDB Cloud

## Project Structure

```
katlio/                 # Next.js Frontend
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   └── components/
│       ├── ChatApp.tsx      # Main chat application
│       ├── ChatPanel.tsx    # Chat message area
│       ├── MobileHeader.tsx # Mobile navigation header
│       ├── Sidebar.tsx      # Room list and user panel
│       └── UserSetup.tsx    # Initial user setup
└── package.json

backend/                # Express.js Backend
├── server.js           # Main server file
├── package.json
├── .env.example        # Environment variables template
└── uploads/           # File upload directory (created automatically)
```

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- MongoDB Cloud account
- Git

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   copy .env.example .env
   ```
   
   Edit `.env` and add your MongoDB Cloud connection string:
   ```
   PORT=5000
   MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/katlio?retryWrites=true&w=majority
   ```

4. **Create uploads directory:**
   ```bash
   mkdir uploads
   ```

5. **Start the backend server:**
   ```bash
   npm run dev
   ```
   
   The backend will run on http://localhost:5000

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd katlio
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   
   The frontend will run on http://localhost:3000

### MongoDB Cloud Setup

1. Create a MongoDB Cloud account at [mongodb.com](https://www.mongodb.com/cloud)
2. Create a new cluster
3. Create a database user with read/write permissions
4. Whitelist your IP address (or use 0.0.0.0/0 for development)
5. Get your connection string and add it to the backend `.env` file

## Usage

1. **Access the application** at http://localhost:3000
2. **Set up your profile** with a display name and optional avatar
3. **Join public rooms** or create new ones
4. **Start private conversations** with online users
5. **Upload files and images** using the paperclip icon
6. **See typing indicators** and read receipts in real-time

## Key Technologies

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend:** Express.js, Socket.io, Node.js
- **Database:** MongoDB Cloud with Mongoose
- **File Uploads:** Multer middleware
- **Real-time:** Socket.io for WebSocket connections
- **Styling:** Tailwind CSS with dark theme
- **Icons:** Lucide React

## Development Features

- **Hot reload** for both frontend and backend
- **TypeScript** for type safety
- **ESLint** for code quality
- **Responsive design** supporting desktop, tablet, and mobile
- **Dark mode** optimized UI
- **Real-time user presence** tracking
- **Message persistence** in MongoDB
- **File upload handling** with preview

## Production Deployment

### Frontend (Vercel recommended)
```bash
cd katlio
npm run build
npm start
```

### Backend (Railway, Heroku, or VPS)
```bash
cd backend
npm start
```

### Environment Variables for Production
- Set `MONGODB_URI` to your production MongoDB connection string
- Set `PORT` for your hosting platform
- Configure CORS origins for your production frontend URL

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.

## Support

For issues and questions, please create an issue in the GitHub repository.
