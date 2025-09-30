const mongoose = require('mongoose');

const ColumnSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Пожалуйста, укажите название колонки'],
      trim: true,
      maxlength: [50, 'Название колонки не может превышать 50 символов'],
    },
    position: {
      type: Number,
      required: true,
      min: [0, 'Позиция не может быть отрицательной'],
    },
    board: {
      type: mongoose.Schema.ObjectId,
      ref: 'Board',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Column = mongoose.model('Column', ColumnSchema);

module.exports = Column;