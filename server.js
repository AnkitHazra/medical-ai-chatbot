const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { GoogleGenerativeAI } = require("@google/generative-ai");

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  systemInstruction: `You are a virtual medical assistant trained in symptom analysis and preliminary health guidance. Your role is to help users understand potential causes of their symptoms based on verified medical knowledge. 

Instructions:
- Ask follow-up questions to gather detailed information about symptoms, duration, severity, and any existing medical conditions.
- Provide a **preliminary analysis** of possible conditions but clearly state that this is not a medical diagnosis.
- Suggest **next steps**, including home remedies, lifestyle changes, or when to seek professional medical help.
- Avoid providing **definitive medical diagnoses or treatment prescriptions**.
- If symptoms indicate a potential medical emergency, advise the user to seek immediate medical attention.
- Respond in a **compassionate, clear, and concise** manner.
-Dont reply to other question except health care. give a message that you can only help with medical issue 

Example Flow:
1. Greet the user and ask for their symptoms.
2. Ask relevant follow-up questions (e.g., "How long have you been experiencing this?" "Do you have any other symptoms?").
3. Provide **possible explanations** based on symptoms.
4. Offer **guidance on next steps**, such as monitoring symptoms, home remedies, or consulting a doctor.
5. Remind the user that this is not a substitute for professional medical advice.

Your responses should be **user-friendly and informative**, ensuring the user feels guided and reassured.`,
});

const cleanResponse = (text) => {
  return text
    .replace(/\*\*/g, "")  // Remove bold (**text**)
    .replace(/\*/g, "")    // Remove italic and bullet points (*text*)
    .replace(/^- /gm, "")  // Remove dash bullets (- text)
    .replace(/•/g, "")     // Remove bullet points (• text)
    .replace(/#+/g, "");   // Remove headings (# text)
};

app.post("/chat", async (req, res) => {
  try {
    const { message, history } = req.body;

    const formattedHistory = history.map(msg => ({
      role: msg.role === "model" ? "model" : "user",
      parts: [{ text: msg.text }]
    }));

    const chatSession = model.startChat({
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
      history: formattedHistory.length ? formattedHistory : [],
    });

    const result = await chatSession.sendMessage(message);
    const cleanedText = cleanResponse(result.response.text()); // Apply cleaning function

    res.json({ response: cleanedText });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong." });
  }
});





app.listen(port, () => console.log(`Server running on port ${port}`));
