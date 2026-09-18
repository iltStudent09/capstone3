import mongoose from 'mongoose';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';

import app from '../app';
import Claim from '../models/Claim';
import Policy from '../models/Policy';
import User from '../models/User';

process.env.JWT_SECRET = 'test-jwt-secret';
process.env.CLIENT_ORIGIN = 'http://localhost:5173';

let mongoServer: MongoMemoryServer;

const createUser = async (overrides: Partial<{ name: string; email: string; password: string; role: 'admin' | 'adjuster' }> = {}) => {
  return User.create({
    name: 'Test User',
    email: 'tester@example.com',
    password: 'Password123',
    role: 'adjuster',
    ...overrides,
  });
};

const loginAndGetToken = async (email = 'tester@example.com', password = 'Password123') => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email, password });

  expect(response.status).toBe(200);

  return response.body.token as string;
};

describe('API integration tests', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  afterEach(async () => {
    await Promise.all([
      Claim.deleteMany({}),
      Policy.deleteMany({}),
      User.deleteMany({}),
    ]);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it('register returns a token', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Arya Stark',
        email: 'arya@example.com',
        password: 'Needle123',
        role: 'adjuster',
      });

    expect(response.status).toBe(201);
    expect(response.body.token).toBeTypeOf('string');
    expect(response.body.user.email).toBe('arya@example.com');
  });

  it('login with wrong password returns 401', async () => {
    await createUser({
      email: 'jon@example.com',
      password: 'CorrectHorse123',
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'jon@example.com',
        password: 'WrongPassword123',
      });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Invalid credentials');
  });

  it('create a claim returns 201', async () => {
    const user = await createUser();
    const policy = await Policy.create({
      policyNumber: 'AUTO-9001',
      holderName: 'Daenerys Targaryen',
      type: 'auto',
      premium: 1200,
      status: 'active',
      effectiveDate: new Date('2026-01-01'),
      expirationDate: new Date('2026-12-31'),
      owner: user._id,
    });

    const token = await loginAndGetToken();

    const response = await request(app)
      .post('/api/claims')
      .set('Authorization', `Bearer ${token}`)
      .send({
        policy: policy._id.toString(),
        description: 'Rear-end collision with bumper damage',
        incidentDate: '2026-07-04',
        amount: 3200,
      });

    expect(response.status).toBe(201);
    expect(response.body.data.description).toBe('Rear-end collision with bumper damage');
    expect(response.body.data.status).toBe('submitted');
  });

  it('get claims without auth returns 401', async () => {
    const response = await request(app).get('/api/claims');

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Missing or invalid Authorization header');
  });

  it('create claim with missing fields returns 400', async () => {
    const user = await createUser();
    const policy = await Policy.create({
      policyNumber: 'HOME-7001',
      holderName: 'Tyrion Lannister',
      type: 'home',
      premium: 2300,
      status: 'active',
      effectiveDate: new Date('2026-01-01'),
      expirationDate: new Date('2026-12-31'),
      owner: user._id,
    });

    const token = await loginAndGetToken();

    const response = await request(app)
      .post('/api/claims')
      .set('Authorization', `Bearer ${token}`)
      .send({
        policy: policy._id.toString(),
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Validation failed');
    expect(response.body.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ message: 'Description is required' }),
        expect.objectContaining({ message: 'Incident date must be a valid date' }),
      ])
    );
  });
});