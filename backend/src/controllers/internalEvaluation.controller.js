import pool from '../config/db.js';

// POST /api/assignments/:assignmentId/groups/:groupId/internal-evaluations
export const submitEvaluation = async (req, res) => {
    const { assignmentId, groupId } = req.params;
    const { evaluateeId, c2_score, c3_score, c4_score } = req.body;
    const evaluatorId = req.user ? req.user.id : null; 

    if (!evaluatorId) return res.status(401).json({ message: 'Unauthorized' });

    if (evaluatorId === evaluateeId) {
        return res.status(400).json({ message: 'Không thể tự chấm điểm chính mình' });
    }

    try {
        // 0. Check if snapshot is already published by teacher
        const pubCheck = await pool.query(
            'SELECT 1 FROM contribution_metrics WHERE assignment_id = $1 AND group_id = $2',
            [assignmentId, groupId]
        );
        if (pubCheck.rowCount > 0) {
            return res.status(400).json({ message: 'Giảng viên đã công bố kết quả đánh giá. Không thể chỉnh sửa hoặc lưu mới.' });
        }

        // 1. Check window
        const assignmentRes = await pool.query('SELECT class_id, deadline FROM assignments WHERE id = $1', [assignmentId]);
        if (assignmentRes.rows.length === 0) return res.status(404).json({ message: 'Assignment not found' });
        
        const assignment = assignmentRes.rows[0];
        const rawDeadline = assignment.deadline || assignment.due_date;

        // 1.5 Check Group Belongs to Assignment's Class (if class_id exists in assignment record)
        if (assignment.class_id) {
            const groupRes = await pool.query('SELECT class_id FROM groups WHERE id = $1', [groupId]);
            if (groupRes.rows.length > 0 && groupRes.rows[0].class_id && groupRes.rows[0].class_id !== assignment.class_id) {
                return res.status(400).json({ message: 'Nhóm không thuộc lớp học của bài tập này' });
            }
        }

        const now = new Date();
        const submissionDeadline = new Date(rawDeadline);
        const reviewDeadline = assignment.review_deadline 
            ? new Date(assignment.review_deadline) 
            : new Date(submissionDeadline.getTime() + 24 * 60 * 60 * 1000); // Mặc định +24h

        if (now < submissionDeadline) {
            return res.status(400).json({ message: 'Chưa đến thời gian chấm nội bộ (Chưa qua hạn nộp bài)' });
        }
        if (now > reviewDeadline) {
            return res.status(400).json({ message: 'Thời gian chấm nội bộ đã kết thúc' });
        }

        // 2. Check membership
        const groupMembersRes = await pool.query('SELECT user_id FROM group_members WHERE group_id = $1', [groupId]);
        const memberIds = groupMembersRes.rows.map(r => r.user_id);
        
        if (!memberIds.includes(evaluatorId)) {
            return res.status(403).json({ message: 'Bạn không thuộc nhóm này' });
        }
        if (!memberIds.includes(evaluateeId)) {
            return res.status(400).json({ message: 'Người được chấm không thuộc nhóm này' });
        }

        // 3. Upsert
        const upsertQuery = `
            INSERT INTO internal_evaluations (group_id, assignment_id, evaluator_id, evaluatee_id, c2_score, c3_score, c4_score)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (assignment_id, evaluator_id, evaluatee_id) 
            DO UPDATE SET 
                c2_score = EXCLUDED.c2_score,
                c3_score = EXCLUDED.c3_score,
                c4_score = EXCLUDED.c4_score,
                updated_at = NOW()
        `;
        await pool.query(upsertQuery, [groupId, assignmentId, evaluatorId, evaluateeId, c2_score, c3_score, c4_score]);

        res.status(201).json({ message: 'Lưu đánh giá thành công' });
    } catch (error) {
        console.error('Submit evaluation error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// GET /api/assignments/:assignmentId/groups/:groupId/internal-evaluations
export const getMyEvaluations = async (req, res) => {
    const { assignmentId, groupId } = req.params;
    const evaluatorId = req.user ? req.user.id : null;

    if (!evaluatorId) return res.status(401).json({ message: 'Unauthorized' });

    try {
        // Check membership
        const checkMember = await pool.query('SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2', [groupId, evaluatorId]);
        if (checkMember.rows.length === 0) return res.status(403).json({ message: 'Bạn không thuộc nhóm này' });

        // Raw per-evaluator data never exposed — MVP: teacher xem aggregate only.
        // Chỉ trả về các phiếu MÀ USER NÀY ĐÃ CHẤM cho người khác để UI có thể hiển thị state và cho update lại.
        // Tuyệt đối KHÔNG trả về evaluator_id của người khác hay điểm mà user này nhận được từ người khác.
        const evalsRes = await pool.query(`
            SELECT evaluatee_id, c2_score, c3_score, c4_score, updated_at 
            FROM internal_evaluations 
            WHERE assignment_id = $1 AND group_id = $2 AND evaluator_id = $3
        `, [assignmentId, groupId, evaluatorId]);

        const pubCheck = await pool.query(
            'SELECT 1 FROM contribution_metrics WHERE assignment_id = $1 AND group_id = $2',
            [assignmentId, groupId]
        );
        const isPublished = pubCheck.rowCount > 0;

        res.json({ evaluations: evalsRes.rows, isPublished });
    } catch (error) {
        console.error('Get evaluations error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
