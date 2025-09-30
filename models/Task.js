// models/Task.js

const mongoose = require('mongoose');

// Схема для комментариев будет вложена в схему задачи
const CommentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    maxlength: 1000,
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const TaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Пожалуйста, укажите заголовок задачи'],
      maxlength: [200, 'Заголовок не может превышать 200 символов'],
    },
    description: {
      type: String,
      maxlength: [2000, 'Описание не может превышать 2000 символов'],
    },
    type: {
      type: String,
      enum: ['task', 'bug', 'story', 'epic'],
      default: 'task',
    },
    priority: {
      type: String,
      enum: ['lowest', 'low', 'medium', 'high', 'highest'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['backlog', 'todo', 'inprogress', 'review', 'done'],
      default: 'todo',
    },
    assignee: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    reporter: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    board: {
      type: mongoose.Schema.ObjectId,
      ref: 'Board',
      required: true,
    },
    column: {
      type: mongoose.Schema.ObjectId,
      ref: 'Column',
      required: true,
    },
    labels: [
      {
        type: String,
        maxlength: 20,
      },
    ],
    storyPoints: {
      type: Number,
      min: 0,
      max: 100,
    },
    dueDate: {
      type: Date,
    },
    comments: [CommentSchema],
  },
  {
    timestamps: true,
  }
);

const Task = mongoose.model('Task', TaskSchema);

module.exports = Task;