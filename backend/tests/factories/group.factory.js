export const createGroupScenario = ({
    groupId = 'group-1',
    classId = 'class-1',
    groupName = 'Team Alpha',
    ownerId = 'teacher-1',
    members = []
} = {}) => {
    return {
        id: groupId,
        class_id: classId,
        name: groupName,
        teacher_id: ownerId,
        created_at: '2025-01-01T12:00:00Z',
        members: members.map(m => ({
            user_id: m.userId,
            full_name: m.fullName || 'Test User',
            email: m.email || 'user@example.com',
            is_leader: m.isLeader || false,
            joined_at: '2025-01-01T12:00:00Z'
        }))
    };
};

export const createMockDbGroupRow = (scenario) => {
    return {
        id: scenario.id,
        class_id: scenario.class_id,
        name: scenario.name,
        created_at: scenario.created_at,
        class_name: 'CS101'
    };
};

export const createMockDbGroupOwnershipRow = (scenario) => {
    return {
        id: scenario.id,
        class_id: scenario.class_id,
        teacher_id: scenario.teacher_id
    };
};
