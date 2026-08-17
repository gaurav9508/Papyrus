"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { ButtonLight } from "@/components/ui/button-light";
import { Input } from "@/components/ui/input";
import { UploadCloud, FileText } from "lucide-react";

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createSession = useMutation(api.sessions.create);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      if (!title) setTitle(selected.name.replace(/\.pdf$/i, ""));
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      setFile(dropped);
      if (!title) setTitle(dropped.name.replace(/\.(pdf|docx|txt)$/i, ""));
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-(--color-cream) p-8 shadow-xl">
        <div className="flex items-start justify-between">
          <span className="text-xs font-semibold tracking-widest text-blue-600">
            ADD TO YOUR LIBRARY
          </span>
          <button
            onClick={() => router.back()}
            className="text-neutral-400 hover:text-neutral-600"
          >
            ✕
          </button>
        </div>

        <h1 className="mt-3 font-serif text-4xl leading-tight text-neutral-900">
          Bring a paper
          <br />
          <span className="italic text-blue-600">to life.</span>
        </h1>

        <p className="mt-3 text-sm text-neutral-500">
          Upload a paper and Papyrus will prepare it for explanation,
          implementation, and questions.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
              isDragging
                ? "border-blue-400 bg-blue-50"
                : "border-neutral-300 bg-white/60 hover:border-neutral-400"
            }`}
          >
            {file ? (
              <>
                <FileText size={26} className="text-blue-500" />
                <p className="font-medium text-neutral-800">{file.name}</p>
                <p className="text-xs text-neutral-400">
                  Click to choose a different file
                </p>
              </>
            ) : (
              <>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                  <UploadCloud size={22} className="text-blue-500" />
                </div>
                <p className="font-semibold text-neutral-800">
                  Drop your paper here
                </p>
                <p className="text-xs text-neutral-400">
                  or click to browse your files
                </p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.docx,.txt"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] tracking-wide text-neutral-400">
            <span>SUPPORTED: PDF · DOCX · TXT</span>
            <span>MAX 25 MB</span>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-neutral-600">
              Notebook title
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Optional — defaults to filename"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="mt-2 flex justify-end gap-3">
            <ButtonLight
              type="button"
              variant="secondary"
              onClick={() => router.back()}
            >
              Cancel
            </ButtonLight>
            <ButtonLight
              type="submit"
              variant="primary"
              disabled={isSubmitting || !file}
            >
              {isSubmitting ? "Starting…" : "+ Add to workspace"}
            </ButtonLight>
          </div>
        </form>
      </div>
    </div>
  );
}
