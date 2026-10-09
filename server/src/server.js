import http from 'http';
import app from './app.js';
import connectDB from './config/db.js';
import { initSockets } from './sockets/index.js';

const PORT = process.env.PORT || 3000;

// Connect to Database
connectDB();

// Create HTTP server using the Express app
const server = http.createServer(app);

// Initialize Socket.io and attach to the HTTP server
initSockets(server);

// Start listening
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
// Nodemon restart trigger
// Attempt 2
