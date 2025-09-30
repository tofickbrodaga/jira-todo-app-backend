// routes/boardRoutes.js

const express = require('express');
const router = express.Router();
const Board = require('../models/Board');
const Task = require('../models/Task');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, async (req, res) => {
  const { name, description, isPublic } = req.body;

  try {
    const board = await Board.create({
      name,
      description,
      isPublic,
      owner: req.user._id,
      members: [req.user._id],
    });

    res.status(201).json(board);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: messages.join('. ') });
    }
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

router.get('/', protect, async (req, res) => {
  try {
    const boards = await Board.find({ members: req.user._id });

    res.json(boards);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// @desc    Создать новую задачу на доске
// @route   POST /api/boards/:boardId/tasks
// @access  Private (только участники доски)
router.post('/:boardId/tasks', protect, async (req, res) => {
  // Проверяем, является ли пользователь участником доски
  const board = await Board.findById(req.params.boardId);
  if (!board || !board.members.includes(req.user._id)) {
      return res.status(403).json({ message: 'Доступ запрещен' });
  }
  
  try {
    const task = await Task.create({
      ...req.body, // Берем все данные из тела запроса (title, description, column, etc.)
      board: req.params.boardId, // ID доски берем из URL
      reporter: req.user._id, // Создатель задачи - текущий пользователь
    });
    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ message: 'Ошибка создания задачи', error: error.message });
  }
});

// @desc    Получить все задачи для доски
// @route   GET /api/boards/:boardId/tasks
// @access  Private (только участники доски)
router.get('/:boardId/tasks', protect, async (req, res) => {
    // Проверка прав доступа
    const board = await Board.findById(req.params.boardId);
    if (!board || !board.members.includes(req.user._id)) {
        return res.status(403).json({ message: 'Доступ запрещен' });
    }

    try {
        const tasks = await Task.find({ board: req.params.boardId });
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});


module.exports = router;