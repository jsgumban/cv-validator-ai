import { readFile } from "fs/promises";
import path from "path";
import pdfParse from "pdf-parse";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { fullName, email, phone, skills, experience, pdfPath } = req.body;

  try {

    // parsing the uploaded pdf
    const filePath = path.join(process.cwd(), "public", pdfPath);
    const buffer = await readFile(filePath);
    const parsed = await pdfParse(buffer);

    const prompt = `
        You are an AI validator. Compare each field in the FORM DATA to the CV TEXT. 
        A field is valid if the information appears clearly and consistently in the CV text.
        Be accurate, but not overly strict — use judgment. Report mismatches precisely.
        
        Respond ONLY with valid JSON:
        {
          "valid": true | false,
          "mismatches": [ "Full Name", "Email", "Phone", "Skills", "Experience" ]
        }
        
        --- FORM DATA ---
        Full Name: ${fullName}
        Email: ${email}
        Phone: ${phone}
        Skills: ${skills}
        Experience: ${experience}
        
        --- CV TEXT ---
        ${parsed.text}
        
        If all fields match, return valid: true and an empty mismatches array.
        Only respond with the JSON object — no explanation, no commentary.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
    });

    const raw = response.choices[0].message.content?.trim() || "";

    let isValid = false;
    let mismatches: string[] = [];

    try {
      const parsed = JSON.parse(raw);
      console.log("parsed reply:", parsed);
      isValid = parsed.valid;
      mismatches = parsed.mismatches;
    } catch (err) {
      console.error("Failed to parse GPT response:", raw);
    }

    return res.status(200).json({ isValid, mismatches });
  } catch (err) {
    console.error("Validation error:", err);
    return res.status(500).json({ error: "Validation failed." });
  }
}
