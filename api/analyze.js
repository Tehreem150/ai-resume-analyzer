// frontend/api/analyze.js
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { resumeText, jobDescription } = req.body;

  if (!resumeText || !jobDescription) {
    return res.status(400).json({ error: "Missing resume text or job description." });
  }

  const prompt = `
  You are an AI resume analyzer.
  Return a JSON object with:
  - score (0-100)
  - matchedSkills
  - missingSkills
  - suggestions

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
    res.json({ result: content });
  } catch (err) {
    res.status(500).json({ error: "AI analysis failed" });
  }
}
