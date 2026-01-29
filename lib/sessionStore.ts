// app/lib/sessionStore.ts
"use client";

export type SessionStage = "PRE_DONE" | "MONSTER_DONE" | "POST_DONE";

export type SessionRow = {
  participantId: string;
  stage: SessionStage;
  updatedAt: string; // ISO
  payload: any;      // JSON blob (pre/post summaries, raw, etc)
};

const keyFor = (participantId: string) => `monster_session:${participantId}`;

export function getSession(participantId: string): SessionRow | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(keyFor(participantId));
    return raw ? (JSON.parse(raw) as SessionRow) : null;
  } catch {
    return null;
  }
}

export function upsertSession(
  participantId: string,
  patch: Partial<Omit<SessionRow, "participantId">>
): SessionRow {
  const existing = getSession(participantId);

  const next: SessionRow = {
    participantId,
    stage: (patch.stage ?? existing?.stage ?? "PRE_DONE") as SessionStage,
    updatedAt: new Date().toISOString(),
    payload: patch.payload ?? existing?.payload ?? {},
  };

  localStorage.setItem(keyFor(participantId), JSON.stringify(next));
  return next;
}

export function clearSession(participantId: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(keyFor(participantId));
}
