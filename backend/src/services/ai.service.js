import { config } from 'dotenv';
config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

import crypto from 'crypto';
import pool from '../config/db.js';
import { SUMMARY_STATUS } from '../constants/index.js';
import { AppError } from '../utils/AppError.js';
import logger from '../utils/logger.util.js';
import { retryWithBackoff } from '../utils/retry.util.js';
import cacheInstance from '../providers/cache.provider.js';

// Concurrency limit helper
const pLimit = async (funcs, limit) => {
    const results = [];
    const executing = [];
    for (const f of funcs) {
        const p = Promise.resolve().then(() => f());
        results.push(p);
        const e = p.then(() => executing.splice(executing.indexOf(e), 1));
        executing.push(e);
        if (executing.length >= limit) {
            await Promise.race(executing);
        }
    }
    return Promise.all(results);
};

const FALLBACK_RESPONSE = Object.freeze({
    category: "UNKNOWN",
    rubric_criteria: "UNKNOWN",
    guidance_message: "Hệ thống AI đang bận hoặc gặp sự cố. Hãy tiếp tục đánh giá dựa trên tiêu chí.",
    suggested_rewrite: ""
});

/**
 * Xây dựng prompt ép AI trả về JSON với format nhất định
 * @param {string} text - Nhận xét của sinh viên
 * @returns {string} - Prompt
 */
const buildPrompt = (text) => {
    return `
Nhận xét của sinh viên: "${text}"

YÊU CẦU BẮT BUỘC: Chỉ trả về duy nhất 1 chuỗi JSON hợp lệ, KHÔNG CÓ BẤT KỲ VĂN BẢN NÀO KHÁC BÊN NGOÀI JSON (không markdown, không code block).
Cấu trúc JSON yêu cầu:
{
  "category": "Chọn 1 trong 4 nhãn như hướng dẫn",
  "rubric_criteria": "Chọn 1 trong các nhãn Rubric",
  "guidance_message": "Lời khuyên ngắn gọn cho sinh viên",
  "suggested_rewrite": "Câu mẫu lịch sự tham khảo"
}
`;
};

/**
 * Gọi API Gemini với AbortController, Exponential Backoff, Error Classification và Size Limit
 */
const callProvider = async (prompt, requestId, customTimeout = null, maxRetries = 3, systemInstruction = null) => {
    if (process.env.AI_MOCK === 'true') {
        logger.info({ requestId, event: 'AI_MOCK_TRIGGERED' });
        return JSON.stringify({
            category: "4. Góp ý chi tiết bám sát tiêu chí chấm điểm",
            rubric_criteria: "Nội dung",
            guidance_message: "Nhận xét của bạn rất chất lượng và có tính xây dựng cao.",
            suggested_rewrite: "Bài làm rất chuẩn chỉ và chi tiết, phát huy tốt nhé!",
            summary: "Bài nộp đạt yêu cầu tốt, lập trình sạch sẽ và có tính ứng dụng cao.",
            strengths: ["Code sạch sẽ", "Cấu trúc rõ ràng"],
            weaknesses: ["Cần bổ sung comment"],
            suggestions: ["Thêm unit test"],
            important_questions: ["Làm thế nào để scale?"],
            keywords: ["Clean code", "Unit test"],
            sentiment: "positive"
        });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        logger.error({ requestId, message: "Missing GEMINI_API_KEY", stage: "callProvider" });
        return null;
    }


    const timeoutMs = customTimeout || parseInt(process.env.AI_TIMEOUT) || 5000;
    const MAX_RESPONSE_SIZE = 1048576; // 1MB Limit
    
    const fetchCall = async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const baseUrl = process.env.AI_API_URL || 'https://generativelanguage.googleapis.com/v1beta';
            const url = `${baseUrl}/models/gemini-3.6-flash:generateContent?key=${apiKey}`;
            const bodyPayload = {
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json" }
            };
            if (systemInstruction) {
                bodyPayload.systemInstruction = { parts: [{ text: systemInstruction }] };
            }

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyPayload),
                signal: controller.signal
            });

            if (!response.ok) {
                const err = new Error(`Provider responded with status: ${response.status}`);
                err.status = response.status;
                throw err;
            }

            const data = await response.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!text || typeof text !== 'string') {
                throw new Error('Invalid response structure');
            }

            const byteSize = Buffer.byteLength(text, 'utf8');
            if (byteSize > MAX_RESPONSE_SIZE) {
                const err = new Error(`Response exceeded max size limit (${byteSize} bytes)`);
                err.code = 'OOM_GUARD';
                throw err;
            }
            
            return text;
        } catch (error) {
            if (error.name === 'AbortError') {
                error.message = `Timeout after ${timeoutMs}ms`;
                error.status = 504;
            }
            throw error;
        } finally {
            clearTimeout(timeoutId);
        }
    };

    try {
        return await retryWithBackoff(fetchCall, {
            retries: maxRetries,
            baseDelay: 300,
            logger,
            requestId,
            context: 'callProvider',
            shouldRetry: (err) => {
                if (err.code === 'OOM_GUARD') return false;
                if (err.status >= 400 && err.status < 500 && err.status !== 429) return false;
                return true;
            }
        });
    } catch (error) {
        logger.error({ requestId, event: 'ai_service_error', error: error.message, stage: 'callProvider' });
        return null;
    }
};

/**
 * Xử lý tách chuỗi JSON khỏi các phần text rác bao quanh
 */
const extractJSON = (text) => {
    if (!text) return "";
    const first = text.indexOf("{");
    const last = text.lastIndexOf("}");
    if (first !== -1 && last !== -1) {
        return text.slice(first, last + 1);
    }
    return text;
};

/**
 * Xử lý parse chuỗi JSON trả về an toàn
 * @param {string} rawResponse 
 * @param {string} requestId 
 * @returns {object} - JSON đã parse hoặc Fallback
 */
const parseResponse = (rawResponse, requestId) => {
    if (!rawResponse) return FALLBACK_RESPONSE;

    try {
        // Loại bỏ markdown code blocks nếu AI vẫn sinh ra
        let cleanText = rawResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
        cleanText = extractJSON(cleanText);
        
        let parsed = JSON.parse(cleanText);
        if (typeof parsed !== "object" || parsed === null) {
            parsed = {};
        }

        // Chuẩn hóa, đảm bảo các trường luôn tồn tại
        return {
            category: parsed.category || FALLBACK_RESPONSE.category,
            rubric_criteria: parsed.rubric_criteria || FALLBACK_RESPONSE.rubric_criteria,
            guidance_message: parsed.guidance_message || FALLBACK_RESPONSE.guidance_message,
            suggested_rewrite: parsed.suggested_rewrite || ""
        };
    } catch (error) {
        logger.error({ 
            event: 'AI_SYNTHESIS_PARSE_ERROR',
            requestId, 
            rawResponse: rawResponse?.slice(0, 150),
            error: error.message 
        });
        return FALLBACK_RESPONSE;
    }
};

/**
 * Sanitize student input for AI prompt to prevent injection/excessive tokens.
 * @param {string} text
 * @returns {string}
 */
const sanitizeInput = (text) => {
    if (!text) return "";
    // Truncate to 1000 characters
    let safeText = text.substring(0, 1000);
    // Remove weird tokens or excessive spaces
    safeText = safeText.replace(/[^\w\s\.,!?áàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ-]/g, ' ');
    return safeText.trim();
};

/**
 * Hàm chính (Orchestrator) của service
 * @param {string} text 
 * @param {string} requestId 
 * @returns {Promise<object>}
 */
export const analyzeComment = async (text, requestId) => {
    try {
        const safeText = sanitizeInput(text);
        const prompt = buildPrompt(safeText);
        
        const systemInstruction = `
Bạn là Trợ lý AI Giáo dục chuyên kiểm duyệt và hướng dẫn sinh viên viết phản hồi đánh giá chéo (Peer-review) chất lượng trong môi trường đại học.

Khi nhận được một câu nhận xét bất kỳ từ sinh viên, hãy phân tích và trả về đúng một định dạng JSON gồm 4 trường:
1. "category": Chọn 1 trong 4 nhãn ("1. Tiêu cực/xúc phạm", "2. Qua loa/hời hợt", "3. Khen chung chung", "4. Góp ý chi tiết bám sát tiêu chí chấm điểm").
2. "rubric_criteria": Chọn 1 trong các nhãn ("Nội dung" | "Hình thức" | "Thái độ" | "Sáng tạo").
3. "guidance_message": Lời khuyên ngắn gọn, mang tính giáo dục giúp sinh viên hiểu nhận xét của mình cần cải thiện điều gì.
4. "suggested_rewrite": Một câu nhận xét mẫu lịch sự, bám sát tiêu chí Rubric để sinh viên tham khảo sửa lại.
`;
        
        const rawResponse = await callProvider(prompt, requestId, null, 3, systemInstruction);
        return parseResponse(rawResponse, requestId);
    } catch (error) {
        logger.error({ requestId, event: 'AI_Service_Error', message: "Unexpected error in analyzeComment", stage: "analyzeComment" });
        return FALLBACK_RESPONSE;
    }
};

export const synthesizeReviews = async (assignmentId, timeframeKey, reviews, totalReviews, reviewsUsed, requestId) => {
    try {
        const hashStr = crypto.createHash('md5').update(reviews.join('||')).digest('hex');
        const cacheKey = `ai_syn_${assignmentId}_${timeframeKey}_${hashStr}`;
        
        const cached = await cacheInstance.get(cacheKey);
        if (cached) {
            logger.info({ event: 'ai_cache_hit', requestId, cacheKey });
            return cached;
        }

        if (!reviews || reviews.length === 0) {
            return {
                summary: "Không có dữ liệu đánh giá.",
                strengths: [],
                weaknesses: [],
                suggestions: [],
                importantQuestions: [],
                keywords: [],
                sentiment: "neutral"
            };
        }
        
        // Chunking (50 reviews per chunk)
        const chunkSize = 50;
        const chunks = [];
        for (let i = 0; i < reviews.length; i += chunkSize) {
            const chunkReviews = reviews.slice(i, i + chunkSize).map(sanitizeInput);
            chunks.push(chunkReviews);
        }
        
        // Parallel chunk synthesis with concurrency limit
        const chunkFuncs = chunks.map(chunk => async () => {
            const prompt = `
Dưới đây là một phần các nhận xét (reviews) của sinh viên về một bài tập. Hãy tóm tắt ngắn gọn các ý chính.
Do not repeat ideas. Merge similar points. Sort by importance (most common first).
Chỉ trả về JSON với cấu trúc: {"summary": "..."}

Reviews:
${JSON.stringify(chunk)}
            `;
            // Synthesis chunk, 10s timeout
            const rawResponse = await callProvider(prompt, requestId, 10000);
            if (rawResponse) {
                try {
                    let cleanText = rawResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
                    cleanText = extractJSON(cleanText);
                    let parsed = JSON.parse(cleanText);
                    if (typeof parsed !== "object" || parsed === null) parsed = {};
                    return parsed.summary;
                } catch(e) {
                    return null;
                }
            }
            return null;
        });

        let chunkSummaries = (await pLimit(chunkFuncs, 3)).filter(s => s);
        chunkSummaries = [...new Set(chunkSummaries)]; // Deduplicate summaries
        
        if (chunkSummaries.length === 0) throw new Error("Tất cả chunk đều thất bại.");

        // Final Synthesis
        const finalPrompt = `
Dưới đây là các phần tóm tắt nhận xét chấm chéo của sinh viên cho một bài tập.
Hãy tổng hợp lại thành 1 JSON duy nhất mô tả tổng quan bài làm của nhóm, điểm mạnh, điểm yếu, gợi ý chung và những câu hỏi quan trọng cần lưu ý.

Do not repeat ideas. Merge similar points. Sort lists by importance (most common first). Limit each list to 3-5 items.
Return ONLY valid JSON. Do not include explanation or markdown.
Cấu trúc JSON yêu cầu:
{
  "summary": "Tóm tắt chung 3-5 dòng",
  "strengths": ["Điểm mạnh 1", "Điểm mạnh 2"],
  "weaknesses": ["Điểm yếu phổ biến 1", "Điểm yếu phổ biến 2"],
  "suggestions": ["Gợi ý khắc phục 1", "Gợi ý khắc phục 2"],
  "important_questions": ["Câu hỏi quan trọng 1", "Câu hỏi quan trọng 2"],
  "keywords": ["keyword1", "keyword2"],
  "sentiment": "positive" // "positive", "negative", or "neutral"
}

Các tóm tắt:
${JSON.stringify(chunkSummaries)}
`;
        const rawFinal = await callProvider(finalPrompt, requestId, 15000);
        if (!rawFinal) {
            throw new Error("Final synthesis failed: Provider returned null or timed out after retries.");
        }

        let cleanText = rawFinal.replace(/```json/gi, '').replace(/```/g, '').trim();
        cleanText = extractJSON(cleanText);
        
        let parsed = {};
        try {
            parsed = JSON.parse(cleanText);
            if (typeof parsed !== "object" || parsed === null) {
                parsed = {};
            }
        } catch (err) {
            logger.error({ 
                event: 'AI_SYNTHESIS_PARSE_ERROR',
                requestId, 
                rawResponse: rawFinal?.slice(0, 150), 
                error: err.message 
            });
            parsed = {};
        }
        
        const safeArray = (val) => Array.isArray(val) ? val : [];
        const cleanString = (val) => typeof val === "string" ? val.trim() : "";
        const cleanArray = (arr) => safeArray(arr).map(item => cleanString(item)).filter(Boolean).slice(0, 5);
        
        const rawSentiment = cleanString(parsed.sentiment).toLowerCase();
        const allowedSentiment = ["positive", "neutral", "negative"];
        const sentiment = allowedSentiment.includes(rawSentiment) ? rawSentiment : "neutral";

        const finalData = {
            summary: cleanString(parsed.summary) || "Không thể tạo bản tóm tắt.",
            strengths: cleanArray(parsed.strengths),
            weaknesses: cleanArray(parsed.weaknesses),
            suggestions: cleanArray(parsed.suggestions),
            importantQuestions: cleanArray(parsed.important_questions),
            keywords: cleanArray(parsed.keywords),
            sentiment: sentiment
        };

        // Cache result for 1 hour (3600 seconds)
        await cacheInstance.set(cacheKey, finalData, 3600);

        return finalData;
    } catch (error) {
        logger.error({ requestId, event: 'AI_Service_Error', message: "Error in synthesizeReviews", stage: "synthesizeReviews", err: error.message });
        return {
            summary: "Lỗi khi tổng hợp bằng AI.",
            strengths: [],
            weaknesses: [],
            suggestions: [],
            importantQuestions: [],
            keywords: [],
            sentiment: "neutral"
        };
    }
};

/**
 * Cập nhật Summary Items từ kết quả AI
 * @param {string} summaryId 
 * @param {Array} itemsData 
 */
export const updateSummaryItemsAI = async (summaryId, itemsData) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const summaryRes = await client.query(`
            SELECT status FROM review_summaries WHERE id = $1 FOR UPDATE
        `, [summaryId]);
        
        if (summaryRes.rowCount === 0) {
            throw new AppError('Summary not found', 404);
        }

        if (summaryRes.rows[0].status === SUMMARY_STATUS.APPROVED) {
             throw new AppError('Cannot update AI items, summary is already approved', 400);
        }

        // Thêm/cập nhật các items sinh ra từ AI, chỉ ghi đè những item chưa bị teacher edit
        for (const item of itemsData) {
            await client.query(`
                UPDATE review_summary_items
                SET content = $1, frequency_count = $2, source_review_ids = $3
                WHERE summary_id = $4 
                  AND topic_category = $5 
                  AND is_teacher_edited = false
            `, [item.content, item.frequency_count || 1, item.source_review_ids || '{}', summaryId, item.topic_category]);
            
            // Nếu MVP yêu cầu thêm mới nếu chưa có thì có thể mở rộng logic INSERT... ON CONFLICT ở đây
        }
        
        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

