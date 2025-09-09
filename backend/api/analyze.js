import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function extractJson(str) {
  try {
    const match = str.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : { raw: str };
  } catch {
    return { raw: str };
  }
}

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
Strictly respond in valid JSON only:

{
  "score": number (0-100),
  "matchedSkills": [ "skill1", "skill2" ],
  "missingSkills": [ "skill1", "skill2" ],
  "suggestions": [ "suggestion1", "suggestion2" ]
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

    res.status(200).json(analysis);
  } catch (err) {
    console.error("AI analysis error:", err);
    res.status(500).json({ error: "Failed to analyze resume." });
  }
}
