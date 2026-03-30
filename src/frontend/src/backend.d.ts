import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type ReplicateApiKey = string;
export interface Project {
    id: string;
    name: string;
    createdAt: bigint;
}
export interface UserProfile {
    name: string;
}
export interface Scene {
    id: string;
    status: SceneStatus;
    order: bigint;
    replicateJobId?: string;
    projectId: string;
    prompt: string;
    videoUrl?: string;
}
export enum SceneStatus {
    pending = "pending",
    done = "done",
    generating = "generating",
    error = "error"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addScene(projectId: string, prompt: string): Promise<Scene>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createProject(name: string): Promise<Project>;
    createReplicatePrediction(apiKey: string, prompt: string): Promise<string>;
    deleteProject(projectId: string): Promise<void>;
    deleteScene(sceneId: string): Promise<void>;
    getAllProjects(): Promise<Array<Project>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getProject(projectId: string): Promise<Project>;
    getReplicateApiKey(user: Principal): Promise<ReplicateApiKey | null>;
    getScenesForProject(projectId: string): Promise<Array<Scene>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    pollReplicatePrediction(apiKey: string, predictionId: string): Promise<string>;
    reorderScenes(sceneId1: string, sceneId2: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    storeReplicateApiKey(key: ReplicateApiKey): Promise<void>;
}
