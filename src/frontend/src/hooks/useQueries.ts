import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Project, Scene } from "../backend";
import { useActor } from "./useActor";

export function useGetAllProjects() {
  const { actor, isFetching } = useActor();
  return useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllProjects();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetProject(projectId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Project>({
    queryKey: ["project", projectId],
    queryFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.getProject(projectId);
    },
    enabled: !!actor && !isFetching && !!projectId,
  });
}

export function useGetScenes(projectId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Scene[]>({
    queryKey: ["scenes", projectId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getScenesForProject(projectId);
    },
    enabled: !!actor && !isFetching && !!projectId,
  });
}

export function useCreateProject() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error("No actor");
      return actor.createProject(name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useDeleteProject() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (projectId: string) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteProject(projectId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useAddScene() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      projectId,
      prompt,
    }: { projectId: string; prompt: string }) => {
      if (!actor) throw new Error("No actor");
      return actor.addScene(projectId, prompt);
    },
    onSuccess: (_data, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ["scenes", projectId] });
    },
  });
}

export function useDeleteScene() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      sceneId,
      projectId: _projectId,
    }: { sceneId: string; projectId: string }) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteScene(sceneId);
    },
    onSuccess: (_data, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ["scenes", projectId] });
    },
  });
}

export function useReorderScenes() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      sceneId1,
      sceneId2,
      projectId: _projectId2,
    }: { sceneId1: string; sceneId2: string; projectId: string }) => {
      if (!actor) throw new Error("No actor");
      return actor.reorderScenes(sceneId1, sceneId2);
    },
    onSuccess: (_data, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ["scenes", projectId] });
    },
  });
}

export function useStoreApiKey() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (key: string) => {
      if (!actor) throw new Error("No actor");
      return actor.storeReplicateApiKey(key);
    },
  });
}

export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}
