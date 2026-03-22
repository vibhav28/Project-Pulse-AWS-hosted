import { useState } from "react";
import { motion } from "framer-motion";
import { Link2, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/auth";
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export default function ConnectJira() {
  const [jiraUrl, setJiraUrl] = useState("");
  const [email, setEmail] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const handleConnect = async (e) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await apiFetch(`${API_URL}/jira-connections/`, {
        method: "POST",
        body: JSON.stringify({ jira_url: jiraUrl, jira_email: email, api_token: apiToken }),
      });
      if (!res.ok) throw new Error("Connection failed");
      setStatus("success");
      setMessage("Jira connected successfully!");
    } catch {
      setStatus("error");
      setMessage("Connection failed. Check your credentials and try again.");
    }
  };
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <h1 className="text-lg font-semibold mb-1">Connect Jira</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Link your Jira workspace to analyze project data
        </p>
        <form onSubmit={handleConnect} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="jira-url">Jira Base URL</Label>
            <Input
              id="jira-url"
              placeholder="https://your-org.atlassian.net"
              value={jiraUrl}
              onChange={(e) => setJiraUrl(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="jira-email">Email</Label>
            <Input
              id="jira-email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="jira-token">API Token</Label>
            <Input
              id="jira-token"
              type="password"
              placeholder="Your Jira API token"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={status === "loading"}
          >
            {status === "loading" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Link2 className="mr-2 h-4 w-4" />
            )}
            Connect
          </Button>
        </form>
        {status === "success" && (
          <div className="flex items-center gap-2 mt-4 text-sm text-primary">
            <CheckCircle2 className="h-4 w-4" />
            {message}
          </div>
        )}
        {status === "error" && (
          <div className="flex items-center gap-2 mt-4 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {message}
          </div>
        )}
      </motion.div>
    </div>
  );
}
