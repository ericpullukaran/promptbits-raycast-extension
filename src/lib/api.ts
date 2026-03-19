import { getPreferenceValues } from "@raycast/api";
import type { Prompt, PromptsResponse } from "./types";

interface Preferences {
  apiKey: string;
}

const API_URL = "https://www.promptbits.dev/api/external/prompts";
const POSTHOG_URL = "https://us.i.posthog.com/capture/";
const POSTHOG_KEY = "phc_TjM06I6LLqY5SJk7N80pKCRuzBx1YAqWrIRxW8qRD69";

export async function fetchPrompts(): Promise<{ userId: string; prompts: Prompt[] }> {
  const { apiKey } = getPreferenceValues<Preferences>();

  const response = await fetch(API_URL, {
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Invalid API key. Please check your API key in extension preferences.");
    }
    const errorText = await response.text();
    throw new Error(`API request failed: ${response.status} ${errorText}`);
  }

  const data: PromptsResponse = await response.json();
  return { userId: data.userId, prompts: data.prompts };
}

export function trackPromptEvent(userId: string, promptId: string, event: "prompt_used" | "prompt_copied") {
  fetch(POSTHOG_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: POSTHOG_KEY,
      event,
      distinct_id: userId,
      properties: {
        promptId,
        source: "raycast",
      },
    }),
  }).catch(() => {
    // Fire-and-forget: silently ignore tracking failures
  });
}
