const Project = require('../models/Project');

// Create project and include creator + selected members
exports.createProject = async (req, res) => {
  try {
    if (!['Admin', 'Project Manager'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Only Admin or Project Manager can create projects' });
    }

    const { name, description, members = [] } = req.body;
    const uniqueMembers = Array.from(
      new Set([req.user._id.toString(), ...members.map((id) => id.toString())])
    );

    const project = await Project.create({
      name: name.trim(),
      description: description.trim(),
      createdBy: req.user._id,
      members: uniqueMembers
    });

    const populated = await project.populate('members', 'name email role');
    return res.status(201).json(populated);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to create project' });
  }
};

// Get projects based on role: Admin sees all; others see projects where they are creator or member
exports.getProjects = async (req, res) => {
  try {
    const query =
      req.user.role === 'Admin'
        ? {}
        : {
            $or: [{ createdBy: req.user._id }, { members: req.user._id }]
          };

    const projects = await Project.find(query)
      .populate('members', 'name email role')
      .sort({ createdAt: -1 });

    return res.json(projects);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch projects' });
  }
};

// Get single project by ID
exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('members', 'name email role');
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const isMember = project.members.some((m) => m._id.toString() === req.user._id.toString());
    const isCreator = project.createdBy.toString() === req.user._id.toString();

    if (req.user.role !== 'Admin' && !isMember && !isCreator) {
      return res.status(403).json({ message: 'Access denied to this project' });
    }

    return res.json(project);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load project' });
  }
};

// Add member to existing project
exports.addProjectMember = async (req, res) => {
  try {
    if (!['Admin', 'Project Manager'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to add project members' });
    }

    const { userId } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const alreadyMember = project.members.some((id) => id.toString() === userId.toString());
    if (!alreadyMember) {
      project.members.push(userId);
      await project.save();
    }

    const updated = await project.populate('members', 'name email role');
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to add member to project' });
  }
};