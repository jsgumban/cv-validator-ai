'use client';

import { useState } from 'react';
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '~/server/api/root';

const api = createTRPCReact<AppRouter>();

export default function HomePage() {
  const [file, setFile] = useState<File | null>(null);
  const submitMutation = api.cv.submit.useMutation();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;

    const fullName = (form.elements.namedItem("fullName") as HTMLInputElement)?.value;
    const email = (form.elements.namedItem("email") as HTMLInputElement)?.value;
    const phone = (form.elements.namedItem("phone") as HTMLInputElement)?.value;
    const skills = (form.elements.namedItem("skills") as HTMLTextAreaElement)?.value;
    const experience = (form.elements.namedItem("experience") as HTMLTextAreaElement)?.value;

    if (!file) {
      alert("Please upload a PDF file.");
      return;
    }

    // Upload PDF file
    const formData = new FormData();
    formData.append("file", file);

    const uploadRes = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!uploadRes.ok) {
      alert("File upload failed.");
      return;
    }

    const { path } = await uploadRes.json();
    const payload = { fullName, email, phone, skills, experience, pdfPath: path };

    // Call validation API (backend parses + checks with OpenAI)
    const validationRes = await fetch("/api/validate", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });


    const { isValid } = await validationRes.json();

    // store result in db via trpc
    const result = await submitMutation.mutateAsync({ ...payload, isValid});
    alert(result.isValid ? "CV validated successfully!" : "Validation failed.");
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto p-6 space-y-4 bg-white shadow-md rounded-xl">
      <input name="fullName" defaultValue="John Hel Gumban" required className="w-full border px-4 py-2 rounded" />
      <input name="email" defaultValue="gumban.johnhel@gmail.com" type="email" required className="w-full border px-4 py-2 rounded" />
      <input name="phone" defaultValue="+63 977 098 5827" required className="w-full border px-4 py-2 rounded" />
      <textarea name="skills" defaultValue="React, Next.js, Node.js" required className="w-full border px-4 py-2 rounded" />
      <textarea name="experience" defaultValue="8+ years full-stack..." required className="w-full border px-4 py-2 rounded" />
      <input type="file" accept="application/pdf" required onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full" />
      <button type="submit" className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">Submit</button>
    </form>
  );
}
