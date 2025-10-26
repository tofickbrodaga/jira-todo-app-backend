const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const Board = require('../models/Board');
const Column = require('../models/Column');

describe('Columns API', () => {
  let token;
  let boardId;

  beforeEach(async () => {
    const userResponse = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'columntester',
        email: 'column@test.com',
        password: 'password123',
      });
    token = userResponse.body.token;

    const boardResponse = await request(app)
      .post('/api/boards')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Board for Columns' });
    boardId = boardResponse.body._id;
  });

  describe('POST /api/boards/:boardId/columns', () => {
    it('should create a new column on a board for a board member', async () => {
      const res = await request(app)
        .post(`/api/boards/${boardId}/columns`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'To Do' });

      expect(res.statusCode).toEqual(201);
      expect(res.body.name).toBe('To Do');
      expect(res.body.board).toBe(boardId);
      expect(res.body.position).toBe(0);

      const columnInDb = await Column.findById(res.body._id);
      expect(columnInDb).not.toBeNull();
    });

    it('should NOT create a column for a user who is NOT a board member', async () => {
      const intruderResponse = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'intruder',
          email: 'intruder@test.com',
          password: 'password123',
        });
      const intruderToken = intruderResponse.body.token;

      const res = await request(app)
        .post(`/api/boards/${boardId}/columns`)
        .set('Authorization', `Bearer ${intruderToken}`)
        .send({ name: 'Hacked Column' });
      expect(res.statusCode).toEqual(403);
    });
  });

  describe('GET /api/boards/:boardId/columns', () => {
    it('should get all columns for a board for a board member', async () => {
      await request(app)
        .post(`/api/boards/${boardId}/columns`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test Column' });

      const res = await request(app)
        .get(`/api/boards/${boardId}/columns`)
        .set('Authorization', `Bearer ${token}`);
        
      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0].name).toBe('Test Column');
    });
  });
});