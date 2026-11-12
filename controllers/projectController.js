const Project = require('../models/Project');
const Ticket = require('../models/Ticket');

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private
const createProject = async (req, res) => {
  try {
    const { name, description, members } = req.body;

    // Ensure creator is automatically included in project members list
    const memberList = members && members.length > 0 ? members : [];
    if (!memberList.includes(req.user._id.toString())) {
      memberList.push(req.user._id);
    }

    const project = await Project.create({
      name,
      description,
      createdBy: req.user._id,
      members: memberList,
    });

    const populatedProject = await Project.findById(project._id)
      .populate('createdBy', 'name email role')
      .populate('members', 'name email role');

    res.status(201).json(populatedProject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res) => {
  try {
    const projects = await Project.find()
      .populate('createdBy', 'name email role')
      .populate('members', 'name email role')
      .sort({ createdAt: -1 });

    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single project by ID
// @route   GET /api/projects/:id
// @access  Private
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'name email role')
      .populate('members', 'name email role');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add member to project
// @route   PUT /api/projects/:id/members
// @access  Private
const addProjectMember = async (req, res) => {
  try {
    const { userId } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!project.members.includes(userId)) {
      project.members.push(userId);
      await project.save();
    }

    const updatedProject = await Project.findById(req.params.id)
      .populate('createdBy', 'name email role')
      .populate('members', 'name email role');

    res.status(200).json(updatedProject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a project and all its associated tickets
// @route   DELETE /api/projects/:id
// @access  Private
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    await Ticket.deleteMany({ project: req.params.id });
    await project.deleteOne();

    res.status(200).json({ message: 'Project and related tickets removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  addProjectMember,
  deleteProject,
};