import { createContext, useCallback, useContext, useState } from "react";
import type { ReactNode } from "react";
import type { Project, Scene, SceneStatus } from "../types";

function generateId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

const SAMPLE_PROJECTS: Project[] = [
  {
    id: "sample-1",
    name: "Nature Documentary Intro",
    aspectRatio: "16:9",
    style: "Cinematic",
    createdAt: new Date(Date.now() - 86400000 * 2),
    scenes: [
      {
        id: "s1",
        projectId: "sample-1",
        prompt:
          "A majestic eagle soaring over misty mountain peaks at golden hour",
        status: "idle",
        progress: 0,
        order: 0,
      },
      {
        id: "s2",
        projectId: "sample-1",
        prompt:
          "A rushing waterfall cascading into a crystal-clear pool surrounded by lush forest",
        status: "idle",
        progress: 0,
        order: 1,
      },
      {
        id: "s3",
        projectId: "sample-1",
        prompt: "Time-lapse of storm clouds building over a vast open prairie",
        status: "idle",
        progress: 0,
        order: 2,
      },
    ],
  },
  {
    id: "sample-2",
    name: "Urban Stories: City at Night",
    aspectRatio: "16:9",
    style: "Documentary",
    createdAt: new Date(Date.now() - 86400000),
    scenes: [
      {
        id: "s4",
        projectId: "sample-2",
        prompt: "Neon signs reflecting on wet city streets after the rain",
        status: "idle",
        progress: 0,
        order: 0,
      },
      {
        id: "s5",
        projectId: "sample-2",
        prompt: "Crowded subway platform with commuters rushing past",
        status: "idle",
        progress: 0,
        order: 1,
      },
    ],
  },
];

interface ProjectContextValue {
  projects: Project[];
  createProject: (name: string) => Project;
  deleteProject: (id: string) => void;
  updateProject: (
    id: string,
    updates: Partial<Pick<Project, "name" | "aspectRatio" | "style">>,
  ) => void;
  getProject: (id: string) => Project | undefined;
  addScene: (projectId: string, prompt: string) => Scene;
  deleteScene: (projectId: string, sceneId: string) => void;
  updateScene: (
    projectId: string,
    sceneId: string,
    updates: Partial<Scene>,
  ) => void;
  reorderScenes: (
    projectId: string,
    sceneId1: string,
    sceneId2: string,
  ) => void;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(SAMPLE_PROJECTS);

  const createProject = useCallback((name: string): Project => {
    const project: Project = {
      id: generateId(),
      name: name.trim() || "Untitled Project",
      aspectRatio: "16:9",
      style: "Cinematic",
      scenes: [],
      createdAt: new Date(),
    };
    setProjects((prev) => [...prev, project]);
    return project;
  }, []);

  const deleteProject = useCallback((id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const updateProject = useCallback(
    (
      id: string,
      updates: Partial<Pick<Project, "name" | "aspectRatio" | "style">>,
    ) => {
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      );
    },
    [],
  );

  const getProject = useCallback(
    (id: string) => projects.find((p) => p.id === id),
    [projects],
  );

  const addScene = useCallback((projectId: string, prompt: string): Scene => {
    const scene: Scene = {
      id: generateId(),
      projectId,
      prompt,
      status: "idle",
      progress: 0,
      order: 0,
    };
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const maxOrder = p.scenes.reduce((m, s) => Math.max(m, s.order), -1);
        return {
          ...p,
          scenes: [...p.scenes, { ...scene, order: maxOrder + 1 }],
        };
      }),
    );
    return scene;
  }, []);

  const deleteScene = useCallback((projectId: string, sceneId: string) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? { ...p, scenes: p.scenes.filter((s) => s.id !== sceneId) }
          : p,
      ),
    );
  }, []);

  const updateScene = useCallback(
    (projectId: string, sceneId: string, updates: Partial<Scene>) => {
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId
            ? {
                ...p,
                scenes: p.scenes.map((s) =>
                  s.id === sceneId ? { ...s, ...updates } : s,
                ),
              }
            : p,
        ),
      );
    },
    [],
  );

  const reorderScenes = useCallback(
    (projectId: string, sceneId1: string, sceneId2: string) => {
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id !== projectId) return p;
          const scenes = [...p.scenes];
          const i1 = scenes.findIndex((s) => s.id === sceneId1);
          const i2 = scenes.findIndex((s) => s.id === sceneId2);
          if (i1 === -1 || i2 === -1) return p;
          const o1 = scenes[i1].order;
          const o2 = scenes[i2].order;
          scenes[i1] = { ...scenes[i1], order: o2 };
          scenes[i2] = { ...scenes[i2], order: o1 };
          return { ...p, scenes };
        }),
      );
    },
    [],
  );

  return (
    <ProjectContext.Provider
      value={{
        projects,
        createProject,
        deleteProject,
        updateProject,
        getProject,
        addScene,
        deleteScene,
        updateScene,
        reorderScenes,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjects() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProjects must be inside ProjectProvider");
  return ctx;
}

export function useProject(id: string) {
  const { projects } = useProjects();
  return projects.find((p) => p.id === id);
}
