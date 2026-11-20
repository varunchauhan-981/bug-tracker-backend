const express = require('express');
const router = express.Router();
const {
  createProject,
  getProjects,
  getProjectById,
  addProjectMember
} = require('../controllers/projectController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').post(protect, createProject).get(protect, getProjects);
router.get('/:id', protect, getProjectById);
router.post('/:id/members', protect, addProjectMember);

module.exports = router;