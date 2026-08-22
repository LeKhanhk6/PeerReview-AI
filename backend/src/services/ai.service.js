import { config } from 'dotenv';
config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

import crypto from 'crypto';

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
const callProvider = async (prompt, requestId, customTimeout = null) => {
    if (!GEMINI_API_KEY) {
        console.error("AI Service Error", { requestId, message: "Missing GEMINI_API_KEY", stage: "callProvider" });
        return null;
    }

    const controller = new AbortController();
    const timeoutMs = customTimeout || parseInt(process.env.AI_TIMEOUT) || 5000;
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
            return null;
        }

        const data = await response.json();
        
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text || typeof text !== 'string') {
            return null;
        }
        
        return text;
    } catch (error) {
        if (error.name === 'AbortError') {
            console.error("AI Service Error", { requestId, message: `Timeout after ${timeoutMs}ms`, stage: "callProvider" });
        } else {
            console.error("AI Service Error", { requestId, message: error.message, stage: "callProvider" });
        }
        return null;
    } finally {
        clearTimeout(timeoutId);
    }
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
        const parsed = JSON.parse(cleanText);

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
        console.error("AI Service Error", { requestId, message: "JSON parse fail", stage: "parseResponse" });
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
        const cacheKey = `${assignmentId}_${timeframeKey}`;
        const cached = synthesisCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
            console.log("Returning cached AI Synthesis for", cacheKey);
            return cached.data;
        }

        if (!reviews || reviews.length === 0) return null;
        
        // Chunking (50 reviews per chunk)
        const chunkSize = 50;
        const chunks = [];
        for (let i = 0; i < reviews.length; i += chunkSize) {
            chunks.push(reviews.slice(i, i + chunkSize));
        }
        
        const chunkSummaries = [];
        for (const chunk of chunks) {
            const prompt = `
Dưới đây là một phần các nhận xét (reviews) của sinh viên về một bài tập. Hãy tóm tắt ngắn gọn các ý chính.
Do not repeat ideas. Merge similar points. Sort by importance (most common first).
Chỉ trả về JSON với cấu trúc: {"summary": "..."}

Reviews:
${JSON.stringify(chunk)}
            `;
            // Synthesis có thể tốn thời gian hơn, cấp 15s cho mỗi chunk
            const rawResponse = await callProvider(prompt, requestId, 15000);
            if (rawResponse) {
                try {
                    const parsed = JSON.parse(rawResponse.replace(/```json/gi, '').replace(/```/g, '').trim());
                    if (parsed.summary) chunkSummaries.push(parsed.summary);
                } catch(e) {
                    // Ignore parse error cho chunk
                }
            }
        }
        
        if (chunkSummaries.length === 0) throw new Error("Tất cả chunk đều thất bại.");

        // Final Synthesis
        const finalPrompt = `
Dưới đây là các phần tóm tắt nhận xét chấm chéo của sinh viên cho một bài tập.
Hãy tổng hợp lại thành 1 JSON duy nhất mô tả tổng quan bài làm của nhóm, điểm mạnh, điểm yếu và gợi ý chung.

Do not repeat ideas. Merge similar points. Sort lists by importance (most common first).
YÊU CẦU BẮT BUỘC: Chỉ trả về duy nhất 1 chuỗi JSON hợp lệ.
Cấu trúc JSON yêu cầu:
{
  "summary": "Tóm tắt chung 3-5 dòng",
  "strengths": ["Điểm mạnh 1", "Điểm mạnh 2"],
  "weaknesses": ["Điểm yếu phổ biến 1", "Điểm yếu phổ biến 2"],
  "suggestions": ["Gợi ý khắc phục 1", "Gợi ý khắc phục 2"]
}

Các tóm tắt:
${JSON.stringify(chunkSummaries)}
`;
        const rawFinal = await callProvider(finalPrompt, requestId, 15000);
        let cleanText = rawFinal ? rawFinal.replace(/```json/gi, '').replace(/```/g, '').trim() : '{}';
        const parsed = JSON.parse(cleanText);
        
        const finalData = {
            summary: parsed.summary || "Không thể tạo bản tóm tắt.",
            strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
            weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
            suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
            totalReviews,
            reviewsUsed,
            confidence: totalReviews > 0 ? parseFloat(Math.min(1, reviewsUsed / totalReviews).toFixed(2)) : 0
        };

        synthesisCache.set(cacheKey, { timestamp: Date.now(), data: finalData });

        return finalData;
    } catch (error) {
        console.error("AI Service Error", { requestId, message: "Error in synthesizeReviews", stage: "synthesizeReviews" });
        return {
            summary: "Lỗi khi tổng hợp bằng AI.",
            reason: error.message,
            strengths: [],
            weaknesses: [],
            suggestions: [],
            totalReviews,
            reviewsUsed,
            confidence: 0
        };
    }
};

