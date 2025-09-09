import formidable from "formidable";
import fs from "fs";
import pdfParse from "pdf-parse";

export const config = {
  api: {
    bodyParser: false, // we use formidable for file parsing
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const form = new formidable.IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "File parsing failed" });
    }

    try {
      const file = files.resume[0]; // 👈 field name must match FormData
      const dataBuffer = fs.readFileSync(file.filepath);

      // extract PDF text
      const pdfData = await pdfParse(dataBuffer);
      return res.status(200).json({ text: pdfData.text });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to extract text" });
    }
  });
}
