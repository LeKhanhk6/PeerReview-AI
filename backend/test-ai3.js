
import { config } from "dotenv";
config();

const apiKey = "AQ.Ab8RN6KAV6toXrhZ7SrpPTWt_ekujN7Q8lX6epO195kZNTnBEw";
const baseUrl = process.env.AI_API_URL || "https://generativelanguage.googleapis.com/v1beta";
const url = `${baseUrl}/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

const bodyPayload = {
    contents: [{ parts: [{ text: "Hello" }] }],
    generationConfig: { responseMimeType: "application/json" }
};

fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bodyPayload)
})
.then(async res => {
    console.log("Status:", res.status);
    console.log("Body:", await res.text());
})
.catch(err => console.error(err));

