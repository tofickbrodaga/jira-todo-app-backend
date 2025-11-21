const express = require('express');
const router = express.Router({ mergeParams: true });

const Column = require('../models/Column');
const Board = require('../models/Board');
const { protect } = require('../middleware/authMiddleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     Column:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: ID колонки
 *         name:
 *           type: string
 *           description: Название колонки
 *         board:
 *           type: string
 *           description: ID доски
 *         position:
 *           type: integer
 *           description: Порядковый номер колонки
 */

/**
 * @swagger
 * tags:
 *   name: Columns
 *   description: Управление колонками (статусами) доски
 */

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

/**
 * @swagger
 * /api/boards/{boardId}/columns:
 *   post:
 *     summary: Создать новую колонку для доски
 *     tags: [Columns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: boardId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID доски
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "In Progress"
 *     responses:
 *       201:
 *         description: Колонка успешно создана
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Column'
 *       403:
 *         description: Доступ запрещен (не участник)
 *       404:
 *         description: Доска не найдена
 *       500:
 *         description: Ошибка сервера
 */
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

/**
 * @swagger
 * /api/boards/{boardId}/columns:
 *   get:
 *     summary: Получить все колонки для доски
 *     tags: [Columns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: boardId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID доски
 *     responses:
 *       200:
 *         description: Список колонок
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Column'
 *       403:
 *         description: Доступ запрещен
 *       404:
 *         description: Доска не найдена
 *       500:
 *         description: Ошибка сервера
 */
router.get('/', async (req, res) => {
  try {
    const columns = await Column.find({ board: req.params.boardId }).sort('position');
    res.json(columns);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;