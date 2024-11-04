const express = require('express');
const path = require('path');
const cors = require('cors'); // Optional, if you need CORS
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors()); // Optional: Enable CORS
app.use(express.static(path.join(__dirname, 'build')));

// Serve the index.html file for any route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});


