const express = require('express');
const router = express.Router({ mergeParams: true });

const Column = require('../models/Column');
const Board = require('../models/Board');
const { protect } = require('../middleware/authMiddleware');

const checkBoardMembership = async (req, res, next) => {
  try {
    const board = await Board.findById(req.params.boardId);

    if (!board) {
      return res.status(404).json({ message: 'Доска не найдена' });
    }
    const isMember = board.members.some(memberId => memberId.equals(req.user._id));

    if (!isMember) {
      return res.status(403).json({ message: 'Доступ запрещен: вы не являетесь участником этой доски' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера при проверке прав' });
  }
};
router.use(protect, checkBoardMembership);


// @desc    Создать новую колонку для доски
// @route   POST /api/boards/:boardId/columns
// @access  Private (только участники доски)
router.post('/', async (req, res) => {
  const { name } = req.body;
  const { boardId } = req.params;

  try {
    const columnCount = await Column.countDocuments({ board: boardId });

    const column = await Column.create({
      name,
      board: boardId,
      position: columnCount,
    });

    res.status(201).json(column);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});


// @desc    Получить все колонки для доски
// @route   GET /api/boards/:boardId/columns
// @access  Private (только участники доски)
router.get('/', async (req, res) => {
  try {
    const columns = await Column.find({ board: req.params.boardId }).sort('position');
    res.json(columns);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;