// routes/boardRoutes.js

const express = require('express');
const router = express.Router();
const Board = require('../models/Board');
const Task = require('../models/Task');
const { protect } = require('../middleware/authMiddleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     Board:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         owner:
 *           type: string
 *         members:
 *           type: array
 *           items:
 *             type: string
 */

/**
 * @swagger
 * tags:
 *   name: Boards
 *   description: Управление досками
 */

/**
 * @swagger
 * /api/boards:
 *   post:
 *     summary: Создание новой доски
 *     tags: [Boards]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Доска успешно создана
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Board'
 *       401:
 *         description: Не авторизован
 */

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

/**
 * @swagger
 * /api/boards:
 *   get:
 *     summary: Получение всех досок пользователя
 *     tags: [Boards]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список досок
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Board'
 *       401:
 *         description: Не авторизован
 */

router.get('/', protect, async (req, res) => {
  try {
    const boards = await Board.find({ members: req.user._id });

    res.json(boards);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

/**
 * @swagger
 * /api/boards/{boardId}/tasks:
 *   post:
 *     summary: Создать новую задачу на доске
 *     tags: [Boards]
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
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Исправить баг в хедере"
 *               description:
 *                 type: string
 *                 example: "Кнопка логина съехала на 10px"
 *               column:
 *                 type: string
 *                 example: "To Do"
 *               assignees:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Задача успешно создана
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       403:
 *         description: Доступ запрещен (пользователь не участник доски)
 *       401:
 *         description: Не авторизован
 *       400:
 *         description: Ошибка создания задачи
 */
router.post('/:boardId/tasks', protect, async (req, res) => {
  const board = await Board.findById(req.params.boardId);
  if (!board || !board.members.includes(req.user._id)) {
      return res.status(403).json({ message: 'Доступ запрещен' });
  }
  
  try {
    const task = await Task.create({
      ...req.body,
      board: req.params.boardId,
      reporter: req.user._id,
    });
    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ message: 'Ошибка создания задачи', error: error.message });
  }
});

/**
 * @swagger
 * /api/boards/{boardId}/tasks:
 *   get:
 *     summary: Получить все задачи для доски
 *     tags: [Boards]
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
 *         description: Список задач
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Task'
 *       403:
 *         description: Доступ запрещен
 *       401:
 *         description: Не авторизован
 *       500:
 *         description: Ошибка сервера
 */
router.get('/:boardId/tasks', protect, async (req, res) => {
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