// server.js
import "dotenv/config";
import express from "express";
import multer from "multer";
import fs from "fs";
import cors from "cors";
import pdf from "pdf-parse-fixed";
import OpenAI from "openai";
import mammoth from "mammoth";

const app = express();
const PORT = process.env.PORT || 5000;

// -------------------- Middleware --------------------
app.use(cors({ origin: "http://localhost:5173" })); // adjust to your React frontend port
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// -------------------- Multer Config --------------------
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Only PDF and DOCX files are allowed."));
    }
    cb(null, true);
  },
});

// -------------------- OpenAI Client --------------------
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// -------------------- Helpers --------------------
async function extractText(filePath, mimetype) {
  if (mimetype === "application/pdf") {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    return data.text;
  }

  if (mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  throw new Error("Unsupported file type");
}

function extractJson(str) {
  try {
    const match = str.match(/\{[\s\S]*\}/); // extract JSON block
    return match ? JSON.parse(match[0]) : { raw: str };
  } catch {
    return { raw: str };
  }
}

// -------------------- Routes --------------------

// Upload & extract
app.post("/upload", upload.single("resume"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const { path: filePath, mimetype } = req.file;

  try {
    const text = await extractText(filePath, mimetype);
    res.json({ text });
  } catch (err) {
    console.error("Text extraction error:", err);
    res.status(500).json({ error: "Failed to extract text from file." });
  } finally {
    // cleanup uploaded file
    fs.unlink(filePath, (err) => {
      if (err) console.warn("File cleanup failed:", err.message);
    });
  }
});

// AI analysis
app.post("/analyze", async (req, res) => {
  const { resumeText, jobDescription } = req.body;

  if (!resumeText || !jobDescription) {
    return res.status(400).json({ error: "Missing resume text or job description." });
  }

  const prompt = `
You are an AI resume analyzer. 
Strictly respond in **valid JSON only** with the following structure:

{
  "score": number (0-100),
  "matchedSkills": [ "skill1", "skill2", ... ],
  "missingSkills": [ "skill1", "skill2", ... ],
  "suggestions": [ "suggestion1", "suggestion2", ... ]
}

Resume:
${resumeText}

Job Description:
${jobDescription}
`;

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.choices[0].message.content;
    const analysis = extractJson(content);

    res.json(analysis);
  } catch (err) {
    console.error("AI analysis error:", err);
    res.status(500).json({ error: "Failed to analyze resume." });
  }
});

// Health check
app.get("/health", (req, res) => res.json({ status: "ok" }));

// -------------------- Start Server --------------------
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
