const express = require('express');
const router = express.Router();
const {
  createTicket,
  getTicketsByProject,
  updateTicket,
  deleteTicket,
  addComment,
} = require('../controllers/ticketController');
const { protect } = require('../middleware/authMiddleware');

// Protect all ticket routes with JWT authentication middleware
router.post('/', protect, createTicket);
router.get('/project/:projectId', protect, getTicketsByProject);
router.route('/:id').put(protect, updateTicket).delete(protect, deleteTicket);
router.post('/:id/comments', protect, addComment);

module.exports = router;