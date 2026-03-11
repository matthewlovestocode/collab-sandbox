import { StubPageHeader } from "@/components/stub-page-header";

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-slate-950">
      <div className="flex min-h-screen w-full flex-col px-6 py-8 sm:px-10 lg:px-12">
        <StubPageHeader
          title="Stub Page Header"
          subtitle="A clearly stubbed page header for testing purposes."
        />
      </div>
    </main>
  );
}
