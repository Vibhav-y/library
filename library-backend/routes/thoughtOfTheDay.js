const express = require('express');
const router = express.Router();
const ThoughtOfTheDay = require('../models/ThoughtOfTheDay');
const authMiddleware = require('../middleware/authMiddleware');

// Get today's thought (public route for students)
router.get('/today', async (req, res) => {
  try {
    // Optionally accept libraryId as query for public fetch
    const { libraryId } = req.query;
    let thought;
    if (libraryId) {
      const active = await ThoughtOfTheDay.find({ library: libraryId, isActive: true }).sort({ order: 1, createdAt: 1 });
      if (active.length > 0) {
        const epoch = new Date('2024-01-01');
        const daysSinceEpoch = Math.floor((new Date() - epoch) / (1000 * 60 * 60 * 24));
        const idx = daysSinceEpoch % active.length;
        thought = active[idx];
      } else {
        thought = null;
      }
    } else {
      thought = await ThoughtOfTheDay.getThoughtForDate();
    }
    
    if (!thought) {
      return res.json({
        thought: "Every day is a new opportunity to learn something amazing!",
        author: "Library Team"
      });
    }
    
    res.json({
      thought: thought.thought,
      author: thought.author
    });
  } catch (error) {
    console.error('Error getting today\'s thought:', error);
    res.status(500).json({ message: 'Error getting today\'s thought', error: error.message });
  }
});

// Get all thoughts (admin only)
router.get('/', authMiddleware.verifyToken, authMiddleware.adminOrManagerOnly, async (req, res) => {
  try {
    const filter = req.user.libraryId ? { library: req.user.libraryId } : {};
    const thoughts = await ThoughtOfTheDay.find(filter)
      .populate('createdBy', 'name email')
      .sort({ order: 1, createdAt: 1 });
    
    res.json(thoughts);
  } catch (error) {
    console.error('Error getting thoughts:', error);
    res.status(500).json({ message: 'Error getting thoughts', error: error.message });
  }
});

// Create new thought (admin only)
router.post('/', authMiddleware.verifyToken, authMiddleware.adminOrManagerOnly, async (req, res) => {
  try {
    const { thought, author } = req.body;
    
    if (!thought) {
      return res.status(400).json({ message: 'Thought text is required' });
    }
    
    // Get the highest order number to add at the end
    const lastThought = await ThoughtOfTheDay.findOne(req.user.libraryId ? { library: req.user.libraryId } : {}).sort({ order: -1 });
    const order = lastThought ? lastThought.order + 1 : 1;
    
    const newThought = new ThoughtOfTheDay({
      thought,
      author: author || 'Anonymous',
      order,
      createdBy: req.user.id,
      library: req.user.libraryId || null
    });
    
    await newThought.save();
    await newThought.populate('createdBy', 'name email');
    
    res.status(201).json(newThought);
  } catch (error) {
    console.error('Error creating thought:', error);
    res.status(500).json({ message: 'Error creating thought', error: error.message });
  }
});

// Update thought (admin only)
router.put('/:id', authMiddleware.verifyToken, authMiddleware.adminOrManagerOnly, async (req, res) => {
  try {
    const { thought, author, isActive } = req.body;
    
    const updatedThought = await ThoughtOfTheDay.findByIdAndUpdate(
      req.params.id,
      { thought, author, isActive },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');
    
    if (!updatedThought) {
      return res.status(404).json({ message: 'Thought not found' });
    }
    
    res.json(updatedThought);
  } catch (error) {
    console.error('Error updating thought:', error);
    res.status(500).json({ message: 'Error updating thought', error: error.message });
  }
});

// Update thoughts order (admin only)
router.put('/reorder/bulk', authMiddleware.verifyToken, authMiddleware.adminOrManagerOnly, async (req, res) => {
  try {
    const { thoughts } = req.body; // Array of { id, order }
    
    if (!Array.isArray(thoughts)) {
      return res.status(400).json({ message: 'Thoughts array is required' });
    }
    
    // Update each thought's order
    const updatePromises = thoughts.map(({ id, order }) =>
      ThoughtOfTheDay.findByIdAndUpdate(id, { order }, { new: true })
    );
    
    await Promise.all(updatePromises);
    
    // Return updated list
    const updatedThoughts = await ThoughtOfTheDay.find(req.user.libraryId ? { library: req.user.libraryId } : {})
      .populate('createdBy', 'name email')
      .sort({ order: 1, createdAt: 1 });
    
    res.json(updatedThoughts);
  } catch (error) {
    console.error('Error reordering thoughts:', error);
    res.status(500).json({ message: 'Error reordering thoughts', error: error.message });
  }
});

// Delete thought (admin only)
router.delete('/:id', authMiddleware.verifyToken, authMiddleware.adminOrManagerOnly, async (req, res) => {
  try {
    const deletedThought = await ThoughtOfTheDay.findByIdAndDelete(req.params.id);
    
    if (!deletedThought) {
      return res.status(404).json({ message: 'Thought not found' });
    }
    
    res.json({ message: 'Thought deleted successfully' });
  } catch (error) {
    console.error('Error deleting thought:', error);
    res.status(500).json({ message: 'Error deleting thought', error: error.message });
  }
});

// Bulk import thoughts (admin only)
router.post('/bulk-import', authMiddleware.verifyToken, authMiddleware.adminOrManagerOnly, async (req, res) => {
  try {
    const { thoughts } = req.body; // Array of { thought, author }
    
    if (!Array.isArray(thoughts) || thoughts.length === 0) {
      return res.status(400).json({ message: 'Thoughts array is required and cannot be empty' });
    }
    
    // Get starting order number
    const lastThought = await ThoughtOfTheDay.findOne(req.user.libraryId ? { library: req.user.libraryId } : {}).sort({ order: -1 });
    let startOrder = lastThought ? lastThought.order + 1 : 1;
    
    const thoughtsToInsert = thoughts.map((thoughtData, index) => ({
      thought: thoughtData.thought,
      author: thoughtData.author || 'Anonymous',
      order: startOrder + index,
      createdBy: req.user.id,
      library: req.user.libraryId || null
    }));
    
    const insertedThoughts = await ThoughtOfTheDay.insertMany(thoughtsToInsert);
    
    res.status(201).json({
      message: `${insertedThoughts.length} thoughts imported successfully`,
      count: insertedThoughts.length
    });
  } catch (error) {
    console.error('Error bulk importing thoughts:', error);
    res.status(500).json({ message: 'Error bulk importing thoughts', error: error.message });
  }
});

module.exports = router;