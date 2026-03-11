type StubPageHeaderProps = {
  title: string;
  subtitle: string;
};

export function StubPageHeader({
  title,
  subtitle,
}: StubPageHeaderProps) {
  return (
    <header className="flex flex-col gap-3 border-b border-black/10 pb-6">
      <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
        {title}
      </h1>
      <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
        {subtitle}
      </p>
    </header>
  );
}
