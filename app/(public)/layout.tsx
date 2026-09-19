import { connection } from "next/server";

import { AgentWidget } from "@/components/public/agent-widget";

export default async function PublicLayout({
  children
}: {
  children: React.ReactNode;
}) {
  await connection();
  const enabled = process.env.GUIDE_AGENT_WIDGET_ENABLED === "true";
  const baseUrl = (process.env.GUIDE_AGENT_PUBLIC_BASE_URL || "").replace(/\/$/, "");

  return (
    <>
      {children}
      {enabled ? <AgentWidget baseUrl={baseUrl} /> : null}
    </>
  );
}
