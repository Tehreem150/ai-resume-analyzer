// frontend/api/upload.js
import multer from "multer";
import fs from "fs";
import pdf from "pdf-parse-fixed";
import mammoth from "mammoth";

const upload = multer({ dest: "/tmp" });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // NOTE: Multer doesn’t work directly with Vercel (no disk writes).
  // For now, you should accept base64 or text instead of file upload.
  return res.json({ error: "File uploads not supported on Vercel. Use text mode." });
}
