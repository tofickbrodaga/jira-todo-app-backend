// tests/tasks.test.js

const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const Board = require('../models/Board');
const Column = require('../models/Column');
const Task = require('../models/Task');

describe('Tasks API', () => {
  let token;
  let userId;
  let boardId;
  let columnId;
  let taskId;

  beforeEach(async () => {
    const userResponse = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'tasktester',
        email: 'task@test.com',
        password: 'password123',
      });
    token = userResponse.body.token;
    userId = userResponse.body._id;

    const boardResponse = await request(app)
      .post('/api/boards')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Board for Tasks' });
    boardId = boardResponse.body._id;

    const columnResponse = await request(app)
      .post(`/api/boards/${boardId}/columns`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'To Do' });
    columnId = columnResponse.body._id;

    const taskResponse = await request(app)
      .post(`/api/boards/${boardId}/tasks`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Initial Task',
        column: columnId,
      });
    taskId = taskResponse.body._id;
  });

  describe('POST /api/boards/:boardId/tasks', () => {
    it('should create a new task for a board member', async () => {
      const res = await request(app)
        .post(`/api/boards/${boardId}/tasks`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'My New Test Task',
          description: 'A detailed description.',
          column: columnId,
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.title).toBe('My New Test Task');
      expect(res.body.board).toBe(boardId);
      expect(res.body.reporter).toBe(userId);
    });

    it('should fail if required fields are missing', async () => {
      const res = await request(app)
        .post(`/api/boards/${boardId}/tasks`)
        .set('Authorization', `Bearer ${token}`)
        .send({ description: 'Task without a title or column' });
      
      expect(res.statusCode).toEqual(400);
    });
  });

  describe('GET requests for tasks', () => {
    it('should get all tasks for a specific board', async () => {
      const res = await request(app)
        .get(`/api/boards/${boardId}/tasks`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0].title).toBe('Initial Task');
    });

    it('should get a single task by its ID', async () => {
      const res = await request(app)
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.title).toBe('Initial Task');
      expect(res.body._id).toBe(taskId);
    });

    it('should return 403 if a non-member tries to get a task', async () => {
      const intruderResponse = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'intruder',
          email: 'intruder@test.com',
          password: 'password123',
        });
      const intruderToken = intruderResponse.body.token;

      const res = await request(app)
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${intruderToken}`);
      
      expect(res.statusCode).toEqual(403);
    });
  });

  describe('PUT /api/tasks/:taskId', () => {
    it('should update a task successfully', async () => {
      const res = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          status: 'inprogress',
          description: 'Updated description.',
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toBe('inprogress');
      expect(res.body.description).toBe('Updated description.');

      const taskInDb = await Task.findById(taskId);
      expect(taskInDb.status).toBe('inprogress');
    });
  });

  describe('DELETE /api/tasks/:taskId', () => {
    it('should delete a task successfully', async () => {
      const res = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBe('Задача успешно удалена');

      const taskInDb = await Task.findById(taskId);
      expect(taskInDb).toBeNull();
    });
  });
});