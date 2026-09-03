import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const baseUrl = process.env.AI_API_URL || 'https://generativelanguage.googleapis.com/v1beta';
const url = `${baseUrl}/models?key=${apiKey}`;

const fetchCall = async () => {
    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e);
    }
};

fetchCall();
