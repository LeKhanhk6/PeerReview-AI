// tests/__mocks__/db.mock.js
import { jest } from '@jest/globals';

const pool = {
    query: jest.fn(),
    connect: jest.fn()
};

export default pool;
