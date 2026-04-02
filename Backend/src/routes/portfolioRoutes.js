const express = require('express');
const router = express.Router();

// Import the logic from the controller we just made
const { getUserPortfolio } = require('../controllers/portfolioController');

// (Optional but recommended) If you have an authentication middleware, you would import it here. 
// Example: const { protect } = require('../middleware/authMiddleware');

// Create the actual route (The door)
// If you use auth middleware, it would look like: router.get('/', protect, getUserPortfolio);
router.get('/', getUserPortfolio);

module.exports = router;