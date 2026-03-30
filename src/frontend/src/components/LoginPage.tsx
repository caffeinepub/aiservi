import { Button } from "@/components/ui/button";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { Film, Loader2, Sparkles } from "lucide-react";
import { motion } from "motion/react";

export function LoginPage() {
  const { login, isLoggingIn, isInitializing } = useInternetIdentity();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex flex-col items-center gap-8 max-w-md text-center"
      >
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center glow-violet">
            <Film className="w-10 h-10 text-primary" />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-primary" />
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="font-display text-4xl font-bold text-foreground tracking-tight">
            AI Video Studio
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Create stunning AI-generated videos. Write prompts, generate scenes,
            and compose your masterpiece.
          </p>
        </div>

        <div className="w-full space-y-4">
          <div className="grid grid-cols-3 gap-3 text-sm">
            {[
              { icon: "✍️", label: "Write prompts" },
              { icon: "🎬", label: "Generate AI video" },
              { icon: "🎞️", label: "Combine scenes" },
            ].map((step, i) => (
              <motion.div
                key={step.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="bg-card border border-border rounded-lg p-3 text-center"
              >
                <div className="text-2xl mb-1">{step.icon}</div>
                <div className="text-muted-foreground text-xs">
                  {step.label}
                </div>
              </motion.div>
            ))}
          </div>

          <Button
            onClick={login}
            disabled={isLoggingIn || isInitializing}
            className="w-full h-12 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 glow-violet"
            data-ocid="login.primary_button"
          >
            {isLoggingIn || isInitializing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Connecting...
              </>
            ) : (
              "Sign in to start creating"
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
