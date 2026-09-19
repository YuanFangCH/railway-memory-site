import type { UserRole } from "@prisma/client";

type AgentRole = "owner" | "member";

function agentBaseUrl() {
  return (process.env.GUIDE_AGENT_ACCOUNT_SYNC_URL || "").trim().replace(/\/+$/, "");
}

function agentSyncToken() {
  return (process.env.GUIDE_AGENT_ACCOUNT_SYNC_TOKEN || "").trim();
}

function mapRole(role: UserRole): AgentRole {
  return role === "SUPER_ADMIN" ? "owner" : "member";
}

async function requestAgent(
  path: string,
  init: RequestInit
): Promise<Response> {
  const baseUrl = agentBaseUrl();
  const token = agentSyncToken();

  if (!baseUrl || !token) {
    throw new Error("Agent 账号同步尚未配置");
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        "X-Account-Sync-Token": token,
        ...(init.headers || {})
      },
      signal: AbortSignal.timeout(15_000)
    });
  } catch {
    throw new Error("无法连接网页讲解助手 Agent，账号未同步");
  }

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.detail || "网页讲解助手 Agent 账号同步失败");
  }

  return response;
}

export async function syncAgentAccount(input: {
  previousUsername?: string;
  username: string;
  displayName: string;
  role: UserRole;
  password?: string;
}) {
  await requestAgent("/api/guide-agent/internal/accounts", {
    method: "PUT",
    body: JSON.stringify({
      previousUsername: input.previousUsername || "",
      username: input.username,
      displayName: input.displayName,
      role: mapRole(input.role),
      password: input.password || ""
    })
  });
}

export async function deleteAgentAccount(username: string) {
  await requestAgent(
    `/api/guide-agent/internal/accounts/${encodeURIComponent(username)}`,
    { method: "DELETE" }
  );
}
