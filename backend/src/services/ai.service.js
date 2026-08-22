import { config } from 'dotenv';
config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Cấu trúc mặc định an toàn khi có lỗi
const FALLBACK_RESPONSE = {
    status: "UNKNOWN",
    suggestion: "Không thể phân tích lúc này. Hãy tiếp tục đánh giá.",
    reason: "Hệ thống AI đang bận hoặc gặp sự cố.",
    improvement: ""
};

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
 * @returns {Promise<string|null>} - Raw text trả về từ AI hoặc null nếu lỗi
 */
const callProvider = async (prompt) => {
    if (!GEMINI_API_KEY) {
        console.error("AI Service Error - Missing GEMINI_API_KEY");
        return null;
    }

    const controller = new AbortController();
    const timeoutMs = parseInt(process.env.AI_TIMEOUT) || 5000;
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
            console.error("AI Service Error", { message: `Timeout after ${timeoutMs}ms`, stage: "callProvider" });
        } else {
            console.error("AI Service Error", { message: error.message, stage: "callProvider" });
        }
        return null;
    } finally {
        clearTimeout(timeoutId);
    }
};

/**
 * Xử lý parse chuỗi JSON trả về an toàn
 * @param {string} rawResponse 
 * @returns {object} - JSON đã parse hoặc Fallback
 */
const parseResponse = (rawResponse) => {
    if (!rawResponse) return FALLBACK_RESPONSE;

    try {
        // Loại bỏ markdown code blocks nếu AI vẫn sinh ra
        let cleanText = rawResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanText);

        // Chuẩn hóa, đảm bảo các trường luôn tồn tại
        return {
            status: parsed.status || FALLBACK_RESPONSE.status,
            suggestion: parsed.suggestion || FALLBACK_RESPONSE.suggestion,
            reason: parsed.reason || FALLBACK_RESPONSE.reason,
            improvement: parsed.improvement || ""
        };
    } catch (error) {
        console.error("AI Service Error - JSON parse fail");
        return FALLBACK_RESPONSE;
    }
};

/**
 * Hàm chính (Orchestrator) của service
 * @param {string} text 
 * @returns {Promise<object>}
 */
export const analyzeComment = async (text) => {
    try {
        const prompt = buildPrompt(text);
        const rawResponse = await callProvider(prompt);
        return parseResponse(rawResponse);
    } catch (error) {
        console.error("AI Service Error - Unexpected error in analyzeComment");
        return FALLBACK_RESPONSE;
    }
};
