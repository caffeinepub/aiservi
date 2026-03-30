export type SceneStatus = "idle" | "generating" | "done" | "error";

export interface Scene {
  id: string;
  projectId: string;
  prompt: string;
  status: SceneStatus;
  progress: number;
  videoUrl?: string;
  order: number;
}

export interface Project {
  id: string;
  name: string;
  aspectRatio: string;
  style: string;
  scenes: Scene[];
  createdAt: Date;
}
