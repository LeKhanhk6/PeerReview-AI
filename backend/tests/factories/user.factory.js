// tests/factories/user.factory.js

export const createMockUserScenario = (overrides = {}) => {
    return {
        id: 'user-id-123',
        email: 'student@example.com',
        password_hash: '$2b$10$xyzMockHashString', // Standard bcrypt hash mock
        full_name: 'Nguyen Van A',
        student_id: 'SE12345',
        role: 'STUDENT',
        role_id: 'role-id-student',
        ...overrides
    };
};

export const createMockDbUserRow = (scenario) => {
    // Database returns snake_case column names based on the JOIN
    return {
        id: scenario.id,
        email: scenario.email,
        password_hash: scenario.password_hash,
        full_name: scenario.full_name,
        student_id: scenario.student_id,
        role: scenario.role
    };
};
