import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getApiKey, setApiKey } from "@/lib/replicate";
import { Eye, EyeOff, Key, Save } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

export function SettingsPage() {
  const [apiKey, setApiKeyState] = useState(getApiKey() ?? "");
  const [showKey, setShowKey] = useState(false);

  const handleSave = () => {
    setApiKey(apiKey.trim());
    toast.success("API key saved");
  };

  return (
    <div className="max-w-lg mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="font-display text-3xl font-bold text-foreground">
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Configure your AI video generation preferences
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-xl p-6 space-y-5"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Key className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Replicate API Key</h2>
            <p className="text-xs text-muted-foreground">
              Required for AI video generation
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">API Key</Label>
          <div className="relative">
            <Input
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKeyState(e.target.value)}
              placeholder="r8_..."
              className="bg-input border-border text-foreground placeholder:text-muted-foreground pr-10 font-mono"
              data-ocid="settings.input"
            />
            <button
              type="button"
              onClick={() => setShowKey((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              data-ocid="settings.toggle"
            >
              {showKey ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Get your API key at{" "}
            <a
              href="https://replicate.com/account/api-tokens"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              replicate.com/account/api-tokens
            </a>
          </p>
        </div>

        <Button
          onClick={handleSave}
          disabled={!apiKey.trim()}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
          data-ocid="settings.save_button"
        >
          <Save className="w-4 h-4" />
          Save Settings
        </Button>
      </motion.div>
    </div>
  );
}
