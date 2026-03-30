import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useProjects } from "@/context/ProjectContext";
import { getApiKey } from "@/lib/replicate";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Film,
  FolderOpen,
  Plus,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

export function ProjectsPage() {
  const navigate = useNavigate();
  const { projects, createProject, deleteProject } = useProjects();
  const [newProjectName, setNewProjectName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const apiKey = getApiKey();

  const handleCreate = () => {
    const project = createProject(newProjectName);
    setNewProjectName("");
    setDialogOpen(false);
    toast.success("Project created!");
    navigate({ to: "/project/$projectId", params: { projectId: project.id } });
  };

  const handleDelete = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    deleteProject(projectId);
    toast.success("Project deleted");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="pt-4 pb-2 space-y-6"
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-primary text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            <span>AI-Powered Creation</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold hero-gradient-text leading-tight">
            Generate Stunning
            <br />
            AI Videos & Voices
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl">
            Turn your ideas into cinematic scenes with AI-generated video and
            authentic Indian voice narration.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="lg"
                className="gradient-primary-btn gap-2 font-semibold px-6"
                data-ocid="projects.open_modal_button"
              >
                <Wand2 className="w-4 h-4" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent
              className="bg-card border-border"
              data-ocid="projects.dialog"
            >
              <DialogHeader>
                <DialogTitle className="font-display text-foreground">
                  Create New Project
                </DialogTitle>
              </DialogHeader>
              <div className="py-2">
                <Input
                  placeholder="e.g. My Cinematic Journey"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                  data-ocid="projects.input"
                />
              </div>
              <DialogFooter>
                <Button
                  variant="ghost"
                  onClick={() => setDialogOpen(false)}
                  data-ocid="projects.cancel_button"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  data-ocid="projects.submit_button"
                >
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* API key banner */}
      {!apiKey && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-lg border border-primary/30 bg-primary/5 p-4 flex items-center justify-between gap-4"
          data-ocid="projects.panel"
        >
          <p className="text-sm text-foreground/80">
            <span className="font-semibold text-primary">
              No API key configured.
            </span>{" "}
            Add your Replicate API key in Settings to generate AI videos.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate({ to: "/settings" })}
            className="border-primary/40 text-primary hover:bg-primary/10 shrink-0"
            data-ocid="projects.secondary_button"
          >
            Go to Settings
          </Button>
        </motion.div>
      )}

      {/* Projects list */}
      {projects.length > 0 ? (
        <div className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">
            Your Projects
          </h2>
          <AnimatePresence>
            <div className="space-y-3" data-ocid="projects.list">
              {projects.map((project, i) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ delay: i * 0.05 }}
                  data-ocid={`projects.item.${i + 1}`}
                >
                  <Card
                    className="bg-card border-border hover:border-primary/50 transition-all cursor-pointer group scene-card-hover"
                    onClick={() =>
                      navigate({
                        to: "/project/$projectId",
                        params: { projectId: project.id },
                      })
                    }
                  >
                    <CardContent className="p-5 flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                        <Film className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">
                          {project.name}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {project.scenes.length} scene
                          {project.scenes.length !== 1 ? "s" : ""} · Created{" "}
                          {project.createdAt.toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => handleDelete(e, project.id)}
                          data-ocid={`projects.item.${i + 1}.delete_button`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20 space-y-4"
          data-ocid="projects.empty_state"
        >
          <div className="w-20 h-20 rounded-2xl bg-muted/50 border border-border flex items-center justify-center mx-auto">
            <FolderOpen className="w-10 h-10 text-muted-foreground/50" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">No projects yet</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Create your first AI video project to get started
            </p>
          </div>
          <Button
            onClick={() => setDialogOpen(true)}
            className="gradient-primary-btn gap-2"
            data-ocid="projects.primary_button"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create First Project
          </Button>
        </motion.div>
      )}
    </div>
  );
}
