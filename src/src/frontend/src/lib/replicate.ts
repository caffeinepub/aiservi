const API_KEY_STORAGE = "replicate_api_key";

export function getApiKey(): string | null {
  return localStorage.getItem(API_KEY_STORAGE) || null;
}

export function setApiKey(key: string): void {
  if (key.trim()) {
    localStorage.setItem(API_KEY_STORAGE, key.trim());
  } else {
    localStorage.removeItem(API_KEY_STORAGE);
  }
}

// Actor type with HTTP outcall proxy methods
export interface ReplicateActor {
  createReplicatePrediction(apiKey: string, prompt: string): Promise<string>;
  pollReplicatePrediction(
    apiKey: string,
    predictionId: string,
  ): Promise<string>;
}

export async function createVideoPrediction(
  prompt: string,
  apiKey: string,
  actor: ReplicateActor,
): Promise<{ id: string }> {
  const json = await actor.createReplicatePrediction(apiKey, prompt);
  const parsed = JSON.parse(json);
  if (parsed.detail) throw new Error(parsed.detail);
  if (!parsed.id) throw new Error(parsed.error || "No prediction ID returned");
  return { id: parsed.id };
}

export async function pollPrediction(
  predictionId: string,
  apiKey: string,
  actor: ReplicateActor,
): Promise<{ status: string; output?: string | string[]; error?: string }> {
  const json = await actor.pollReplicatePrediction(apiKey, predictionId);
  const parsed = JSON.parse(json);
  if (parsed.detail) throw new Error(parsed.detail);
  return parsed;
}
