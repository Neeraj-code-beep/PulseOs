const express = require('express');
const router = express.Router();
const TodoModel = require('../models/Todo');
// Creating the todo..
router.post('/', async (req, res) => {
  try {
    const todo = await TodoModel.create({
      title: req.body.title,
    });
    res.json('Todo created successfully');
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Showing all the todo..
router.get('/', async (req, res) => {
  try {
    const Todos = await TodoModel.find();
    res.json(Todos);
  } catch {
    res.status(500).json({ message: error.message });
  }
});

// Delete the todo...
router.delete('/:id', async (req, res) => {
  try {
    const todoID = req.params.id;
    await TodoModel.findOneAndDelete({
      _id: todoID,
    });
    res.json('Todo deleted successfully.');
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const todoID = req.params.id;
    await TodoModel.findByIdAndUpdate(
      {
        _id: todoID,
      },
      {
        title: req.body.title,
      },
    );
    res.json('Todo updated successfully.');
  } catch (err) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
