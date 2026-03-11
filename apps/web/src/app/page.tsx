import { AgentTestPanel } from "@/components/agent-test-panel";
import { StubPageHeader } from "@/components/stub-page-header";

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-slate-950">
      <div className="flex min-h-screen w-full flex-col px-6 py-8 sm:px-10 lg:px-12">
        <StubPageHeader
          title="Agent Workflow Test"
          subtitle="Use this page to create an agent job, stream SSE updates, and verify the end-to-end client and server flow."
        />
        <AgentTestPanel />
      </div>
    </main>
  );
}
