const Ticket = require('../models/Ticket');

// @desc    Create a new bug ticket
// @route   POST /api/tickets
// @access  Private
const createTicket = async (req, res) => {
  try {
    const { title, description, project, assignedTo, priority, status } = req.body;

    const ticket = await Ticket.create({
      title,
      description,
      project,
      assignedTo: assignedTo || null,
      createdBy: req.user._id,
      priority: priority || 'Medium',
      status: status || 'To Do',
    });

    const populatedTicket = await Ticket.findById(ticket._id)
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email role')
      .populate('comments.user', 'name email role');

    res.status(201).json(populatedTicket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get tickets for a project with optional search & filter query params
// @route   GET /api/tickets/project/:projectId
// @access  Private
const getTicketsByProject = async (req, res) => {
  try {
    const { status, priority, assignedTo, search } = req.query;
    const query = { project: req.params.projectId };

    if (status && status !== 'All') query.status = status;
    if (priority && priority !== 'All') query.priority = priority;
    if (assignedTo && assignedTo !== 'All') query.assignedTo = assignedTo;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const tickets = await Ticket.find(query)
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email role')
      .populate('comments.user', 'name email role')
      .sort({ createdAt: -1 });

    res.status(200).json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update ticket details or Kanban status
// @route   PUT /api/tickets/:id
// @access  Private
const updateTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    const updatedTicket = await Ticket.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email role')
      .populate('comments.user', 'name email role');

    res.status(200).json(updatedTicket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a ticket
// @route   DELETE /api/tickets/:id
// @access  Private
const deleteTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    await ticket.deleteOne();
    res.status(200).json({ message: 'Ticket removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a comment to a ticket
// @route   POST /api/tickets/:id/comments
// @access  Private
const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    ticket.comments.push({
      user: req.user._id,
      text,
    });

    await ticket.save();

    const updatedTicket = await Ticket.findById(req.params.id)
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email role')
      .populate('comments.user', 'name email role');

    res.status(201).json(updatedTicket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createTicket,
  getTicketsByProject,
  updateTicket,
  deleteTicket,
  addComment,
};