import { config } from 'dotenv';
config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

import crypto from 'crypto';
import pool from '../config/db.js';
import { SUMMARY_STATUS } from '../utils/constants.js';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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

// Cấu trúc mặc định an toàn khi có lỗi
const FALLBACK_RESPONSE = Object.freeze({
    status: "UNKNOWN",
    suggestion: "Không thể phân tích lúc này. Hãy tiếp tục đánh giá.",
    reason: "Hệ thống AI đang bận hoặc gặp sự cố.",
    improvement: ""
});

/**
 * Xây dựng prompt ép AI trả về JSON với format nhất định
 * @param {string} text - Nhận xét của sinh viên
 * @returns {string} - Prompt
 */
const buildPrompt = (text) => {
    return `
Bạn là một trợ lý AI giúp phân tích nhận xét chấm chéo (peer review) của sinh viên.
Hãy phân tích nhận xét sau đây và đánh giá mức độ xây dựng (constructiveness), sự phù hợp, giọng điệu, và độ độc hại (toxicity).
Nếu nhận xét tốt, hãy khích lệ. Nếu nhận xét tiêu cực, cộc lốc hoặc chung chung, hãy gợi ý cách cải thiện.

Nhận xét của sinh viên: "${text}"

YÊU CẦU BẮT BUỘC: Chỉ trả về duy nhất 1 chuỗi JSON hợp lệ, KHÔNG CÓ BẤT KỲ VĂN BẢN NÀO KHÁC BÊN NGOÀI JSON (không markdown, không code block).
Nếu không tuân thủ đúng format JSON, kết quả sẽ bị loại bỏ.
Cấu trúc JSON yêu cầu:
{
  "status": "GOOD" | "NEEDS_IMPROVEMENT" | "TOXIC",
  "suggestion": "Câu gợi ý ngắn gọn (1-2 câu) cho sinh viên",
  "reason": "Lý do ngắn gọn tại sao nhận xét này tốt hoặc chưa tốt",
  "improvement": "Ví dụ cách viết lại cho tốt hơn (nếu cần, nếu không thì để trống)"
}
`;
};

/**
 * Gọi API Gemini với AbortController để xử lý timeout
 * @param {string} prompt - Prompt đã được build
 * @param {string} requestId - UUID để tracing log
 * @param {number} customTimeout - (Optional) Custom timeout in ms
 * @returns {Promise<string|null>} - Raw text trả về từ AI hoặc null nếu lỗi
 */
const callProvider = async (prompt, requestId, customTimeout = null, retries = 1) => {
    if (!GEMINI_API_KEY) {
        console.error("AI Service Error", { requestId, message: "Missing GEMINI_API_KEY", stage: "callProvider" });
        return null;
    }

    const timeoutMs = customTimeout || parseInt(process.env.AI_TIMEOUT) || 5000;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }],
                    generationConfig: {
                        responseMimeType: "application/json",
                    }
                }),
                signal: controller.signal
            });

            if (!response.ok) {
                console.error("AI Service Error", {
                    requestId,
                    message: `Provider responded with status: ${response.status}`,
                    stage: "callProvider"
                });
                if (attempt < retries) {
                    await sleep(300 * (attempt + 1));
                    continue;
                }
                return null;
            }

            const data = await response.json();
            
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!text || typeof text !== 'string') {
                if (attempt < retries) {
                    await sleep(300 * (attempt + 1));
                    continue;
                }
                return null;
            }
            
            return text;
        } catch (error) {
            if (error.name === 'AbortError') {
                console.error("AI Service Error", { requestId, message: `Timeout after ${timeoutMs}ms (attempt ${attempt + 1})`, stage: "callProvider" });
            } else {
                console.error("AI Service Error", { requestId, message: error.message, stage: "callProvider" });
            }
            if (attempt < retries) {
                await sleep(300 * (attempt + 1));
                continue;
            }
            return null;
        } finally {
            clearTimeout(timeoutId);
        }
    }
    return null;
};

/**
 * Xử lý tách chuỗi JSON khỏi các phần text rác bao quanh
 */
const extractJSON = (text) => {
    if (!text) return "";
    const match = text.match(/\{[\s\S]*\}/);
    return match ? match[0] : text;
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

        const validStatus = ["GOOD", "NEEDS_IMPROVEMENT", "TOXIC"];
        const statusVal = parsed.status ? parsed.status.toUpperCase() : "";

        // Chuẩn hóa, đảm bảo các trường luôn tồn tại và đúng enum
        return {
            status: validStatus.includes(statusVal) ? statusVal : FALLBACK_RESPONSE.status,
            suggestion: parsed.suggestion || FALLBACK_RESPONSE.suggestion,
            reason: parsed.reason || FALLBACK_RESPONSE.reason,
            improvement: parsed.improvement || ""
        };
    } catch (error) {
        console.error("AI_SYNTHESIS_PARSE_ERROR", { 
            requestId, 
            rawResponse: rawResponse?.slice(0, 300),
            error: error.message 
        });
        return FALLBACK_RESPONSE;
    }
};

/**
 * Hàm chính (Orchestrator) của service
 * @param {string} text 
 * @param {string} requestId 
 * @returns {Promise<object>}
 */
export const analyzeComment = async (text, requestId) => {
    try {
        const prompt = buildPrompt(text);
        const rawResponse = await callProvider(prompt, requestId);
        return parseResponse(rawResponse, requestId);
    } catch (error) {
        console.error("AI Service Error", { requestId, message: "Unexpected error in analyzeComment", stage: "analyzeComment" });
        return FALLBACK_RESPONSE;
    }
};

// Simple in-memory cache for MVP
const synthesisCache = new Map();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

/**
 * Phân tích và tổng hợp các review bằng AI với cơ chế Chunking.
 * @param {string} assignmentId
 * @param {string} timeframeKey
 * @param {Array<string>} reviews - Mảng các chuỗi nhận xét.
 * @param {number} totalReviews - Tổng số review ban đầu.
 * @param {number} reviewsUsed - Số review thực tế đưa vào phân tích sau khi sample/filter.
 * @param {string} requestId - Trace ID.
 * @returns {Promise<object>} JSON chứa summary, strengths, weaknesses, suggestions, ...
 */
export const synthesizeReviews = async (assignmentId, timeframeKey, reviews, totalReviews, reviewsUsed, requestId) => {
    try {
        const hashStr = crypto.createHash('md5').update(reviews.join('||')).digest('hex');
        const cacheKey = `${assignmentId}_${timeframeKey}_${hashStr}`;
        const cached = synthesisCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
            console.log({ requestId, cacheKey, message: "cache hit" });
            return cached.data;
        }

        // Cache eviction: remove oldest if exceeding limit
        if (synthesisCache.size > 1000) {
            const firstKey = synthesisCache.keys().next().value;
            synthesisCache.delete(firstKey);
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
            chunks.push(reviews.slice(i, i + chunkSize));
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
            console.error("AI_SYNTHESIS_PARSE_ERROR", { 
                requestId, 
                rawResponse: rawFinal?.slice(0, 300), 
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

        synthesisCache.set(cacheKey, { timestamp: Date.now(), data: finalData });

        return finalData;
    } catch (error) {
        console.error("AI Service Error", { requestId, message: "Error in synthesizeReviews", stage: "synthesizeReviews", err: error.message });
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
            throw new Error('Summary not found');
        }

        if (summaryRes.rows[0].status === SUMMARY_STATUS.APPROVED) {
             throw new Error('Cannot update AI items, summary is already approved');
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

