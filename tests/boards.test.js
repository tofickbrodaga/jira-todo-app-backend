const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const Board = require('../models/Board');

describe('Boards API', () => {
  let token;
  let userId;

  beforeEach(async () => {
    const userResponse = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'boardtester',
        email: 'board@test.com',
        password: 'password123',
      });
    
    token = userResponse.body.token;
    userId = userResponse.body._id;
  });

  // --- Тесты для создания досок ---
  describe('POST /api/boards', () => {
    it('should create a new board for an authenticated user', async () => {
      const res = await request(app)
        .post('/api/boards')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'My First Board',
          description: 'This is a test board.',
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.name).toBe('My First Board');
      expect(res.body.owner).toBe(userId);
      const boardInDb = await Board.findById(res.body._id);
      expect(boardInDb).not.toBeNull();
    });

    it('should NOT create a board for an unauthenticated user', async () => {
      const res = await request(app)
        .post('/api/boards')
        .send({ name: 'Unauthorized Board' });

      expect(res.statusCode).toEqual(401);
    });

    it('should return a 400 error if the board name is missing', async () => {
      const res = await request(app)
        .post('/api/boards')
        .set('Authorization', `Bearer ${token}`)
        .send({ description: 'Board without a name' });

      expect(res.statusCode).toEqual(400);
    });
  });

  // --- Тесты для получения досок ---
  describe('GET /api/boards', () => {
    it('should get all boards where the user is a member', async () => {
      await request(app)
        .post('/api/boards')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'My Visible Board' });
      const res = await request(app)
        .get('/api/boards')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0].name).toBe('My Visible Board');
    });

    it('should NOT get boards for an unauthenticated user', async () => {
      const res = await request(app).get('/api/boards');
      expect(res.statusCode).toEqual(401);
    });
  });
});