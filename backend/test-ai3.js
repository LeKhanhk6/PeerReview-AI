import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const baseUrl = process.env.AI_API_URL || 'https://generativelanguage.googleapis.com/v1beta';
const url = `${baseUrl}/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

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

const prompt = buildPrompt("Một phát hiện cực kỳ tinh tế! Lý do 2 nút này đang hoạt động 'y chang nhau' là vì quy tắc bảo mật của trình duyệt web (CORS - Cross-Origin).");

const fetchCall = async () => {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
            })
        });

        const data = await response.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e);
    }
};

fetchCall();
