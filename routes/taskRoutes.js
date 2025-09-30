const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Board = require('../models/Board');
const { protect } = require('../middleware/authMiddleware');

const checkTaskAccess = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ message: 'Задача не найдена' });
    }

    const board = await Board.findById(task.board);
    if (!board.members.includes(req.user._id)) {
      return res.status(403).json({ message: 'Доступ к задаче запрещен' });
    }

    req.task = task;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// @desc    Получить одну задачу по ID
// @route   GET /api/tasks/:taskId
// @access  Private
router.get('/:taskId', protect, checkTaskAccess, async (req, res) => {
  res.json(req.task);
});

// @desc    Обновить задачу (переместить, изменить описание и т.д.)
// @route   PUT /api/tasks/:taskId
// @access  Private
router.put('/:taskId', protect, checkTaskAccess, async (req, res) => {
  try {
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.taskId,
      req.body,
      { new: true, runValidators: true }
    );
    res.json(updatedTask);
  } catch (error) {
    res.status(400).json({ message: 'Ошибка при обновлении задачи', error: error.message });
  }
});

// @desc    Удалить задачу
// @route   DELETE /api/tasks/:taskId
// @access  Private
router.delete('/:taskId', protect, checkTaskAccess, async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.taskId);
    res.json({ message: 'Задача успешно удалена' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// @desc    Добавить комментарий к задаче
// @route   POST /api/tasks/:taskId/comments
// @access  Private (только участники доски)
router.post('/:taskId/comments', protect, checkTaskAccess, async (req, res) => {
  const { content } = req.body;
  
  if (!content) {
    return res.status(400).json({ message: 'Содержимое комментария не может быть пустым' });
  }

  try {
    const task = req.task;

    const newComment = {
      content,
      user: req.user._id,
    };
    task.comments.unshift(newComment);
    await task.save();
    await task.populate('comments.user', 'username email');
    
    res.status(201).json(task.comments);

  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера при добавлении комментария' });
  }
});


// @desc    Удалить комментарий из задачи
// @route   DELETE /api/tasks/:taskId/comments/:commentId
// @access  Private (только автор комментария)
router.delete('/:taskId/comments/:commentId', protect, checkTaskAccess, async (req, res) => {
  try {
    const task = req.task;
    const { commentId } = req.params;

    const comment = task.comments.find(c => c._id.toString() === commentId);

    if (!comment) {
      return res.status(404).json({ message: 'Комментарий не найден' });
    }
    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Вы не можете удалить чужой комментарий' });
    }
    task.comments = task.comments.filter(c => c._id.toString() !== commentId);
    await task.save();
    res.json({ message: 'Комментарий успешно удален' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера при удалении комментария' });
  }
});


module.exports = router;