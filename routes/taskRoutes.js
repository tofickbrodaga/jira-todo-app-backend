const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Board = require('../models/Board');
const { protect } = require('../middleware/authMiddleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     Comment:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         content:
 *           type: string
 *           description: Текст комментария
 *         user:
 *           type: string
 *           description: ID пользователя (или объект с данными пользователя)
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * tags:
 *   - name: Tasks
 *     description: Управление задачами
 *   - name: Comments
 *     description: Комментарии к задачам
 */

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

/**
 * @swagger
 * /api/tasks/{taskId}:
 *   get:
 *     summary: Получить одну задачу по ID
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID задачи
 *     responses:
 *       200:
 *         description: Данные задачи
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       403:
 *         description: Доступ запрещен (не участник доски)
 *       404:
 *         description: Задача не найдена
 *       401:
 *         description: Не авторизован
 */
router.get('/:taskId', protect, checkTaskAccess, async (req, res) => {
  res.json(req.task);
});

/**
 * @swagger
 * /api/tasks/{taskId}:
 *   put:
 *     summary: Обновить задачу
 *     description: Обновляет поля задачи (заголовок, описание, колонку, позицию и т.д.)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID задачи
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               column:
 *                 type: string
 *                 description: ID новой колонки (статуса)
 *               assignees:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Обновленная задача
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       400:
 *         description: Ошибка валидации
 *       403:
 *         description: Доступ запрещен
 *       404:
 *         description: Задача не найдена
 */
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

/**
 * @swagger
 * /api/tasks/{taskId}:
 *   delete:
 *     summary: Удалить задачу
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID задачи
 *     responses:
 *       200:
 *         description: Задача успешно удалена
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Задача успешно удалена"
 *       403:
 *         description: Доступ запрещен
 *       404:
 *         description: Задача не найдена
 */
router.delete('/:taskId', protect, checkTaskAccess, async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.taskId);
    res.json({ message: 'Задача успешно удалена' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

/**
 * @swagger
 * /api/tasks/{taskId}/comments:
 *   post:
 *     summary: Добавить комментарий к задаче
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID задачи
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 example: "Нужно перепроверить верстку"
 *     responses:
 *       201:
 *         description: Комментарий добавлен (возвращает обновленный список комментариев)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Пустой комментарий
 *       403:
 *         description: Доступ запрещен
 *       404:
 *         description: Задача не найдена
 */
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

/**
 * @swagger
 * /api/tasks/{taskId}/comments/{commentId}:
 *   delete:
 *     summary: Удалить комментарий из задачи
 *     description: Удалить можно только свой собственный комментарий
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID задачи
 *       - in: path
 *         name: commentId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID комментария
 *     responses:
 *       200:
 *         description: Комментарий успешно удален
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Комментарий успешно удален"
 *       403:
 *         description: Вы не можете удалить чужой комментарий
 *       404:
 *         description: Комментарий или задача не найдена
 */
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