import multer from "multer";
import fs from "fs";
import pdf from "pdf-parse-fixed";
import mammoth from "mammoth";

const upload = multer({
  dest: "/tmp", // Vercel allows writing to /tmp only
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

// Helper: extract text
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

export const config = {
  api: { bodyParser: false }, // allow multer to handle file
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  return new Promise((resolve, reject) => {
    upload.single("resume")(req, res, async (err) => {
      if (err) return reject(res.status(400).json({ error: err.message }));
      if (!req.file) return reject(res.status(400).json({ error: "No file uploaded" }));

      const { path: filePath, mimetype } = req.file;

      try {
        const text = await extractText(filePath, mimetype);
        res.status(200).json({ text });
      } catch (error) {
        console.error("Text extraction error:", error);
        res.status(500).json({ error: "Failed to extract text from file." });
      } finally {
        fs.unlink(filePath, () => {}); // cleanup
        resolve();
      }
    });
  });
}
