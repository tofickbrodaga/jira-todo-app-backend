const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'Пользователь не найден' });
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Нет авторизации, токен недействителен' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Нет авторизации, нет токена' });
  }
};

module.exports = { protect };