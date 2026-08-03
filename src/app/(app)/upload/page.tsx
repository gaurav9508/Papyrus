"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UploadCloud, FileText } from "lucide-react";

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createSession = useMutation(api.sessions.create);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      if (!title) setTitle(selected.name.replace(/\.pdf$/i, ""));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Please choose a PDF file to upload.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const finalTitle = title.trim() || file.name.replace(/\.pdf$/i, "");

      const sessionId = await createSession({
        title: finalTitle,
        paperSourceId: "upload",
        paperSource: "upload",
        paperTitle: finalTitle,
        paperAuthors: [],
        paperAbstract: "",
      });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("sessionId", sessionId);
      formData.append("title", finalTitle);

      fetch("/api/notebooks/generate-from-upload", {
        method: "POST",
        body: formData,
      });

      router.push(`/sessions/${sessionId}`);
    } catch {
      setError("Something went wrong starting the upload. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-stone-900">Upload a Paper</h1>
      <p className="text-stone-600">
        Upload a paper PDF directly and Papyrus will generate a step-by-step implementation notebook from it.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div
          onClick={() => fileInputRef.current?.click()}
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-stone-300 p-10 text-center hover:border-stone-400"
        >
          {file ? (
            <>
              <FileText size={28} className="text-stone-600" />
              <p className="font-medium text-stone-800">{file.name}</p>
              <p className="text-xs text-stone-400">Click to choose a different file</p>
            </>
          ) : (
            <>
              <UploadCloud size={28} className="text-stone-400" />
              <p className="text-stone-600">Click to select a PDF</p>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-stone-700">Notebook title</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Optional — defaults to filename" />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" disabled={isSubmitting || !file} className="self-start">
          {isSubmitting ? "Starting generation…" : "Generate Notebook"}
        </Button>
      </form>
    </div>
  );
}
