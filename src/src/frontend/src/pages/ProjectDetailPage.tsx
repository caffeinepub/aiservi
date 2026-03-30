import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useProject, useProjects } from "@/context/ProjectContext";
import { useActor } from "@/hooks/useActor";
import {
  createVideoPrediction,
  getApiKey,
  pollPrediction,
  setApiKey,
} from "@/lib/replicate";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Film,
  Loader2,
  Play,
  Plus,
  Save,
  Settings,
  Trash2,
  Video,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { Scene, SceneStatus } from "../types";

export function ProjectDetailPage() {
  const { projectId } = useParams({ from: "/project/$projectId" });
  const navigate = useNavigate();
  const project = useProject(projectId);
  const { addScene, deleteScene, updateScene, reorderScenes, updateProject } =
    useProjects();
  const { actor } = useActor();

  // All hooks MUST be declared before any conditional returns
  const [newPrompt, setNewPrompt] = useState("");
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<"scenes" | "preview">("scenes");
  const [projectName, setProjectName] = useState(project?.name ?? "");
  const [aspectRatio, setAspectRatio] = useState(
    project?.aspectRatio ?? "16:9",
  );
  const [style, setStyle] = useState(project?.style ?? "Cinematic");
  const [apiKey, setApiKeyState] = useState(getApiKey() ?? "");
  const [showApiKey, setShowApiKey] = useState(false);

  const sortedScenes = project
    ? [...project.scenes].sort((a, b) => a.order - b.order)
    : [];

  const handleGenerateScene = useCallback(
    async (scene: Scene) => {
      const key = getApiKey();
      if (!key) {
        toast.error("Please enter your Replicate API key in Settings");
        return;
      }
      if (!actor) {
        toast.error("Backend not ready. Please wait a moment and try again.");
        return;
      }
      updateScene(projectId, scene.id, { status: "generating", progress: 0 });
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress = Math.min(progress + Math.random() * 8, 88);
        updateScene(projectId, scene.id, { progress });
      }, 3000);
      try {
        const prediction = await createVideoPrediction(
          scene.prompt,
          key,
          actor as unknown as Parameters<typeof createVideoPrediction>[2],
        );
        let attempts = 0;
        while (attempts < 120) {
          await new Promise((r) => setTimeout(r, 3000));
          const result = await pollPrediction(
            prediction.id,
            key,
            actor as unknown as Parameters<typeof pollPrediction>[2],
          );
          if (result.status === "succeeded") {
            const url = Array.isArray(result.output)
              ? result.output[0]
              : result.output;
            clearInterval(progressInterval);
            updateScene(projectId, scene.id, {
              status: "done",
              progress: 100,
              videoUrl: url,
            });
            toast.success("Scene generated!");
            return;
          }
          if (result.status === "failed" || result.status === "canceled") {
            throw new Error(result.error || "Generation failed");
          }
          attempts++;
        }
        throw new Error("Generation timed out");
      } catch (err) {
        clearInterval(progressInterval);
        updateScene(projectId, scene.id, { status: "error", progress: 0 });
        toast.error(
          `Scene failed: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    },
    [actor, projectId, updateScene],
  );

  const handleBulkGenerate = useCallback(async () => {
    const key = getApiKey();
    if (!key) {
      toast.error("No API key. Go to Settings first.");
      return;
    }
    const pending = sortedScenes.filter(
      (s) => s.status === "idle" || s.status === "error",
    );
    if (pending.length === 0) {
      toast.info("No pending scenes to generate");
      return;
    }
    setIsBulkGenerating(true);
    toast.info(`Generating ${pending.length} scenes...`);
    for (const scene of pending) {
      await handleGenerateScene(scene);
    }
    setIsBulkGenerating(false);
    toast.success("Bulk generation complete!");
  }, [sortedScenes, handleGenerateScene]);

  if (!project) {
    return (
      <div
        className="max-w-5xl mx-auto text-center py-20"
        data-ocid="project.error_state"
      >
        <p className="text-muted-foreground">Project not found.</p>
        <Button
          className="mt-4"
          onClick={() => navigate({ to: "/" })}
          data-ocid="project.link"
        >
          Back to Projects
        </Button>
      </div>
    );
  }

  const doneScenes = sortedScenes.filter(
    (s) => s.status === "done" && s.videoUrl,
  );

  const handleAddScene = () => {
    if (!newPrompt.trim()) return;
    addScene(projectId, newPrompt.trim());
    setNewPrompt("");
    toast.success("Scene added");
  };

  const handleSaveSettings = () => {
    updateProject(projectId, { name: projectName, aspectRatio, style });
    setApiKey(apiKey);
    toast.success("Settings saved");
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Top bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-6"
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate({ to: "/" })}
          className="text-muted-foreground hover:text-foreground"
          data-ocid="project.link"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-0.5">
            <button
              type="button"
              className="hover:text-primary cursor-pointer"
              onClick={() => navigate({ to: "/" })}
            >
              Projects
            </button>
            <span>/</span>
            <span className="text-foreground">{project.name}</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            {project.name}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-border text-muted-foreground gap-2"
            data-ocid="project.secondary_button"
          >
            <Save className="w-3.5 h-3.5" />
            Save
          </Button>
          <Button
            size="sm"
            onClick={handleBulkGenerate}
            disabled={isBulkGenerating || !actor}
            className="bg-primary/90 hover:bg-primary text-primary-foreground gap-2"
            data-ocid="project.primary_button"
          >
            {isBulkGenerating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" />
                Generate All
              </>
            )}
          </Button>
        </div>
      </motion.div>

      {/* 2-column layout: main + settings */}
      <div className="grid grid-cols-[1fr_300px] gap-6">
        {/* Main column */}
        <div className="space-y-6">
          {/* Tabs */}
          <div className="flex gap-1 bg-muted/30 rounded-lg p-1 w-fit border border-border">
            <button
              type="button"
              onClick={() => setActiveTab("scenes")}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === "scenes"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-ocid="project.tab"
            >
              Scene Editor
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === "preview"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-ocid="project.tab"
            >
              Preview
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "scenes" ? (
              <motion.div
                key="scenes"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="p-4 border-b border-border flex items-center justify-between">
                    <div>
                      <h2 className="font-semibold text-foreground">
                        Video Timeline
                      </h2>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {sortedScenes.length} scene
                        {sortedScenes.length !== 1 ? "s" : ""} total
                      </p>
                    </div>
                    <Film className="w-4 h-4 text-muted-foreground" />
                  </div>

                  <div className="divide-y divide-border">
                    {sortedScenes.length === 0 ? (
                      <div
                        className="p-8 text-center"
                        data-ocid="scenes.empty_state"
                      >
                        <p className="text-muted-foreground text-sm">
                          No scenes yet. Add one below.
                        </p>
                      </div>
                    ) : (
                      <AnimatePresence>
                        {sortedScenes.map((scene, i) => (
                          <SceneRow
                            key={scene.id}
                            scene={scene}
                            index={i}
                            total={sortedScenes.length}
                            onDelete={() => deleteScene(projectId, scene.id)}
                            onMoveUp={() =>
                              i > 0 &&
                              reorderScenes(
                                projectId,
                                scene.id,
                                sortedScenes[i - 1].id,
                              )
                            }
                            onMoveDown={() =>
                              i < sortedScenes.length - 1 &&
                              reorderScenes(
                                projectId,
                                scene.id,
                                sortedScenes[i + 1].id,
                              )
                            }
                            onGenerate={() => handleGenerateScene(scene)}
                            onPromptChange={(prompt) =>
                              updateScene(projectId, scene.id, { prompt })
                            }
                          />
                        ))}
                      </AnimatePresence>
                    )}
                  </div>

                  <div className="p-4 border-t border-border space-y-3">
                    <Textarea
                      placeholder='Describe the scene... e.g. "A majestic eagle soaring over misty mountain peaks at sunrise"'
                      value={newPrompt}
                      onChange={(e) => setNewPrompt(e.target.value)}
                      className="bg-input border-border text-foreground placeholder:text-muted-foreground min-h-[72px] resize-none text-sm"
                      data-ocid="scenes.textarea"
                    />
                    <Button
                      onClick={handleAddScene}
                      disabled={!newPrompt.trim()}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 w-full"
                      data-ocid="scenes.submit_button"
                    >
                      <Plus className="w-4 h-4" />
                      Add Scene
                    </Button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-card border border-border rounded-xl p-6"
              >
                {doneScenes.length === 0 ? (
                  <div
                    className="text-center py-12 text-muted-foreground"
                    data-ocid="preview.empty_state"
                  >
                    <Video className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No generated videos yet</p>
                    <p className="text-sm mt-1 opacity-70">
                      Generate scenes to see them here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4" data-ocid="preview.list">
                    <h2 className="font-semibold text-foreground">
                      {doneScenes.length} Generated Scene
                      {doneScenes.length !== 1 ? "s" : ""}
                    </h2>
                    {doneScenes.map((scene, i) => (
                      <div
                        key={scene.id}
                        className="space-y-1"
                        data-ocid={`preview.item.${i + 1}`}
                      >
                        <p className="text-xs text-muted-foreground font-medium">
                          Scene {sortedScenes.indexOf(scene) + 1}
                        </p>
                        <video
                          src={scene.videoUrl}
                          controls
                          className="w-full rounded-lg border border-border bg-black max-h-64"
                        >
                          <track kind="captions" />
                        </video>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right settings panel */}
        <div>
          <div className="bg-card border border-border rounded-xl overflow-hidden sticky top-20">
            <div className="p-4 border-b border-border flex items-center gap-2">
              <Settings className="w-4 h-4 text-muted-foreground" />
              <h2 className="font-semibold text-foreground text-sm">
                Settings
              </h2>
            </div>
            <div className="p-4 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Project Name
                </Label>
                <Input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="bg-input border-border text-foreground text-sm h-8"
                  data-ocid="settings.input"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Aspect Ratio
                </Label>
                <Select value={aspectRatio} onValueChange={setAspectRatio}>
                  <SelectTrigger
                    className="bg-input border-border text-foreground text-sm h-8"
                    data-ocid="settings.select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="16:9">16:9 — Landscape</SelectItem>
                    <SelectItem value="9:16">9:16 — Portrait</SelectItem>
                    <SelectItem value="1:1">1:1 — Square</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Style</Label>
                <Select value={style} onValueChange={setStyle}>
                  <SelectTrigger
                    className="bg-input border-border text-foreground text-sm h-8"
                    data-ocid="settings.select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="Cinematic">Cinematic</SelectItem>
                    <SelectItem value="Animation">Animation</SelectItem>
                    <SelectItem value="Documentary">Documentary</SelectItem>
                    <SelectItem value="Artistic">Artistic</SelectItem>
                    <SelectItem value="Realistic">Realistic</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator className="bg-border" />

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Replicate API Key
                </Label>
                <div className="relative">
                  <Input
                    type={showApiKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKeyState(e.target.value)}
                    placeholder="r8_..."
                    className="bg-input border-border text-foreground text-sm h-8 pr-8 font-mono"
                    data-ocid="settings.input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    data-ocid="settings.toggle"
                  >
                    {showApiKey ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                onClick={handleSaveSettings}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-sm h-8"
                data-ocid="settings.save_button"
              >
                <Save className="w-3.5 h-3.5 mr-1.5" />
                Save Settings
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- SceneRow inline component ----
interface SceneRowProps {
  scene: Scene;
  index: number;
  total: number;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onGenerate: () => void;
  onPromptChange: (prompt: string) => void;
}

function SceneRow({
  scene,
  index,
  total,
  onDelete,
  onMoveUp,
  onMoveDown,
  onGenerate,
  onPromptChange,
}: SceneRowProps) {
  const [showVideo, setShowVideo] = useState(false);
  const [editing, setEditing] = useState(false);
  const [localPrompt, setLocalPrompt] = useState(scene.prompt);
  const isGenerating = scene.status === "generating";

  const statusColor: Record<SceneStatus, string> = {
    idle: "text-muted-foreground",
    generating: "text-blue-400",
    done: "text-green-400",
    error: "text-destructive",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="p-4"
      data-ocid={`scenes.item.${index + 1}`}
    >
      <div className="flex items-start gap-3">
        {/* Order controls */}
        <div className="flex flex-col items-center gap-0.5 shrink-0 pt-1">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30"
            data-ocid={`scenes.item.${index + 1}.button`}
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs text-muted-foreground font-mono w-5 text-center">
            {index + 1}
          </span>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === total - 1}
            className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30"
            data-ocid={`scenes.item.${index + 1}.button`}
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-medium capitalize ${statusColor[scene.status]}`}
            >
              {scene.status === "generating" && (
                <Loader2 className="w-3 h-3 animate-spin inline mr-1" />
              )}
              {scene.status === "done" && (
                <CheckCircle2 className="w-3 h-3 inline mr-1" />
              )}
              {scene.status === "error" && (
                <AlertCircle className="w-3 h-3 inline mr-1" />
              )}
              {scene.status}
            </span>
          </div>

          {editing ? (
            <div className="space-y-2">
              <Textarea
                value={localPrompt}
                onChange={(e) => setLocalPrompt(e.target.value)}
                className="bg-input border-border text-foreground text-sm min-h-[60px] resize-none"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="h-7 text-xs bg-primary text-primary-foreground"
                  onClick={() => {
                    onPromptChange(localPrompt);
                    setEditing(false);
                  }}
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  onClick={() => {
                    setLocalPrompt(scene.prompt);
                    setEditing(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="text-sm text-foreground/80 leading-relaxed text-left w-full hover:text-foreground"
              onClick={() => setEditing(true)}
            >
              {scene.prompt}
            </button>
          )}

          {isGenerating && (
            <div className="space-y-1">
              <Progress value={scene.progress} className="h-1.5" />
              <p className="text-xs text-muted-foreground">
                {Math.round(scene.progress)}%
              </p>
            </div>
          )}

          {scene.status === "done" && scene.videoUrl && (
            <div className="rounded-lg overflow-hidden border border-border">
              {showVideo ? (
                <video
                  src={scene.videoUrl}
                  controls
                  className="w-full max-h-48 bg-black"
                >
                  <track kind="captions" />
                </video>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowVideo(true)}
                  className="w-full h-20 bg-muted/50 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                  data-ocid={`scenes.item.${index + 1}.button`}
                >
                  <Play className="w-4 h-4" />
                  Preview clip
                </button>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1 shrink-0">
          {scene.status !== "done" && (
            <Button
              size="sm"
              onClick={onGenerate}
              disabled={isGenerating}
              className="bg-primary/90 hover:bg-primary text-primary-foreground text-xs h-7 gap-1"
              data-ocid={`scenes.item.${index + 1}.primary_button`}
            >
              {isGenerating ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : scene.status === "error" ? (
                <>
                  <AlertCircle className="w-3 h-3" />
                  Retry
                </>
              ) : (
                <>
                  <Video className="w-3 h-3" />
                  Generate
                </>
              )}
            </Button>
          )}
          <button
            type="button"
            onClick={onDelete}
            className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
            data-ocid={`scenes.item.${index + 1}.delete_button`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
