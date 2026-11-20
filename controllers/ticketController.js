const Ticket = require('../models/Ticket');

// Create new ticket/issue
exports.createTicket = async (req, res) => {
  try {
    const { title, description, priority, assignedTo, project, status } = req.body;

    const ticket = await Ticket.create({
      title: title.trim(),
      description: description.trim(),
      priority: priority || 'Medium',
      status: status || 'To Do',
      project,
      createdBy: req.user._id,
      assignedTo: assignedTo || null
    });

    const populated = await ticket.populate('assignedTo', 'name email role');
    return res.status(201).json(populated);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to create ticket' });
  }
};

// Get all tickets for a project
exports.getTicketsByProject = async (req, res) => {
  try {
    const tickets = await Ticket.find({ project: req.params.projectId })
      .populate('assignedTo', 'name email role')
      .sort({ createdAt: -1 });

    return res.json(tickets);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch tickets' });
  }
};

// Update ticket status, priority, assignee, title, or description
exports.updateTicket = async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.assignedTo === '') {
      updates.assignedTo = null;
    }

    const ticket = await Ticket.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    }).populate('assignedTo', 'name email role');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    return res.json(ticket);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to update ticket' });
  }
};

// Delete a ticket
exports.deleteTicket = async (req, res) => {
  try {
    if (!['Admin', 'Project Manager'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Only Admin or Project Manager can delete tickets' });
    }

    const ticket = await Ticket.findByIdAndDelete(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    return res.json({ message: 'Ticket deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete ticket' });
  }
};

// Add comment to a ticket
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    ticket.comments.push({
      user: req.user._id,
      authorName: req.user.name,
      text: text.trim()
    });

    await ticket.save();
    const updated = await Ticket.findById(req.params.id).populate('assignedTo', 'name email role');
    return res.status(201).json(updated);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to add comment' });
  }
};