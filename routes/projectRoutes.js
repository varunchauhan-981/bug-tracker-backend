const express = require('express');
const router = express.Router();
const {
  createProject,
  getProjects,
  getProjectById,
  addProjectMember,
  deleteProject,
} = require('../controllers/projectController');
const { protect } = require('../middleware/authMiddleware');

// Protect all project routes with JWT authentication middleware
router.route('/').post(protect, createProject).get(protect, getProjects);
router.route('/:id').get(protect, getProjectById).delete(protect, deleteProject);
router.route('/:id/members').put(protect, addProjectMember);

module.exports = router;