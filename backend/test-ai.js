import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const baseUrl = process.env.AI_API_URL || 'https://generativelanguage.googleapis.com/v1beta';
const url = `${baseUrl}/models/gemini-3.6-flash:generateContent?key=${apiKey}`;

const prompt = "Analyze the sentiment of this text: I love this project!";

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
        console.log("Status:", response.status);
        console.log("Response:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e);
    }
};

fetchCall();
