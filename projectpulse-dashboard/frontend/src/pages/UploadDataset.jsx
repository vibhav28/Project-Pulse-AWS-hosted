import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  Upload,
  FileUp,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/auth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export default function UploadDataset() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [message, setMessage] = useState("");
  const inputRef = useRef(null);

  const handleUpload = async () => {
    if (!file) return;
    setStatus("loading");
    setMessage("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("file_name", file.name);

      let res;
      try {
        res = await apiFetch(`${API_URL}/datasets/`, {
          method: "POST",
          body: formData,
        });
      } catch (networkErr) {
        throw new Error(
          "Cannot reach the server. Make sure the backend is running on port 8000."
        );
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg =
          typeof data === "object"
            ? Object.entries(data)
              .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
              .join(" | ")
            : "Upload failed";
        throw new Error(msg || "Upload failed");
      }

      setStatus("success");
      setMessage("Dataset uploaded successfully!");
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (err) {
      setStatus("error");
      setMessage(err.message || "Upload failed. Please try again.");
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <h1 className="text-lg font-semibold mb-1">Upload Dataset</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Upload a CSV file to analyze with AI
        </p>
        <div
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed rounded-xl p-10 text-center cursor-pointer hover:border-primary/40 hover:bg-primary/[0.02] transition-colors"
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              setFile(e.target.files?.[0] || null);
              setStatus("idle");
              setMessage("");
            }}
          />
          <FileUp className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          {file ? (
            <p className="text-sm font-medium">{file.name}</p>
          ) : (
            <>
              <p className="text-sm font-medium">Click to select a CSV file</p>
              <p className="text-xs text-muted-foreground mt-1">
                Only .csv files supported
              </p>
            </>
          )}
        </div>
        <Button
          onClick={handleUpload}
          disabled={!file || status === "loading"}
          className="w-full mt-4"
        >
          {status === "loading" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-2 h-4 w-4" />
          )}
          Upload
        </Button>
        {status === "success" && (
          <div className="flex items-center gap-2 mt-4 text-sm text-primary">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {message}
          </div>
        )}
        {status === "error" && (
          <div className="flex items-start gap-2 mt-4 text-sm text-destructive rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{message}</span>
          </div>
        )}
      </motion.div>
    </div>
  );
}
