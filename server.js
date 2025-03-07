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
  systemInstruction: `You are a virtual medical assistant trained in symptom analysis. 
  Your role is to help users understand potential causes of their symptoms based on verified medical knowledge.
  - Provide preliminary analysis but DO NOT give medical diagnoses.
  - Suggest next steps, like lifestyle changes or consulting a doctor.
  - If symptoms suggest an emergency, advise seeking immediate medical help.`,
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
