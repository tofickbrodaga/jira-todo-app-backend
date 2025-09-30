const mongoose = require('mongoose');

const BoardSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Пожалуйста, укажите название доски'],
      trim: true,
      maxlength: [100, 'Название доски не может превышать 100 символов'],
    },
    description: {
      type: String,
      maxlength: [500, 'Описание не может превышать 500 символов'],
    },
    owner: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
    isPublic: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Board = mongoose.model('Board', BoardSchema);

module.exports = Board;