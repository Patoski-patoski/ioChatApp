# messaging_backend_system

## Express.js, JavaScript MongoDB, SOCKET.IO

Creating a real-time application using Express, JavaScript, MongoDB, Redis and socket.io library.

* A simple chat application demonstrating biderectional interaction.

## License

This project is licensed under the MIT License - see the [MIT License]( https://github.com/Patoski-patoski/messagin-backend-system/blob/main/LICENSE) file for details;


## Real-Time Chat Application

A robust real-time chat application built with Node.js, Express, Socket.IO, and MongoDB. Features secure user authentication, private chat rooms, real-time messaging, and persistent message history.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## Features

* 🔐 Secure user authentication and session management
* 💬 Real-time messaging with Socket.IO
* 🏠 Multiple chat room support
* 👥 User presence detection
* ⌨️ Typing indicators
* 📱 Responsive design
* 💾 Persistent message history
* 🔒 Redis session storage
* 🌐 Production-ready configuration

## Tech Stack

* **Backend:** Node.js, Express
* **Real-time Communication:** Socket.IO
* **Database:** MongoDB
* **Session Store:** Redis
* **Authentication:** bcrypt
* **Frontend:** HTML, CSS, JavaScript
* **View Engine:** EJS

## Prerequisites

Before running this application, make sure you have the following installed:

* Node.js (v14 or higher)
* MongoDB
* Redis

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Environment
NODE_ENV=development

# Server
PORT=3000
HOSTNAME=localhost

# Session
SESSION_SECRET=your-development-secret-here

# MongoDB
MONGODB_URI_ATLAS=your-mongodb-uri-here

# Redis
REDIS_USERNAME=default
REDIS_URL=your-redis-url-here
REDIS_REST_TOKEN=your-redis-token-here
REDIS_PORT=6379

# Cookie and Security
COOKIE_DOMAIN=localhost
ALLOWED_ORIGINS=http://localhost:3000
```

## Installation

1. Clone the repository:

```bash
git clone https://github.com/Patoski-patoski/messaging_backend_system
cd messaging_backend_system
```

1. Install dependencies:

```bash
npm install
```

1. Start the application:

```bash
# Development mode
npm run dev

# Production mode
npm start
```

The application will be available at `http://localhost:3000`

## Project Structure

```markdown
├── socket/
│   └── socket.js         # Socket.IO configuration and event handlers
├── routes/
│   ├── index.js         # Main route handlers
│   ├── users.js         # User-related routes
│   └── database.js      # Database connection setup
├── public/
│   ├── javascripts/     # Client-side JavaScript
│   ├── stylesheets/     # CSS files
│   └── index.html       # Main HTML file
│   └── *.html           # Other HTML files
├── middleware/
│   ├── auth.js          # Authentication middleware
│   └── validation.js    # Input validation
├── views/               # EJS templates
├── app.js              # Express application setup
└── config.js           # Application configuration
```

## API Endpoints

### Authentication

* `POST /signup` - Create new user account
* `POST /login` - User login
* `GET /logout` - User logout

### Chat

* `POST /add_friend` - Add a new friend
* `GET /rooms` - Get available chat interface

## WebSocket Events

### Client to Server

* `enterRoom` - Join a chat room
* `message` - Send a message
* `activity` - User typing indicator

### Server to Client

* `message` - Receive a message
* `chatHistory` - Get room message history
* `userList` - Get active users in room
* `activity` - Receive typing indicators

## Security Features

* Password hashing with bcrypt
* Secure session management
* CORS protection
* Rate limiting
* HTTP-only cookies
* Environment-based security configurations

## Production Deployment

For production deployment:

1. Set all required environment variables
2. Enable secure cookies and proper CORS configuration
3. Set up MongoDB and Redis with proper security measures
4. Configure a reverse proxy (e.g., Nginx).Optional
5. Enable SSL/TLS

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License.2

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

* Socket.IO team for the excellent real-time engine
* Express.js community
* MongoDB team
* Redis community

## Support

For support, please open an issue in the GitHub repository or contact the maintainers.
