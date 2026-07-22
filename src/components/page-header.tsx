export function PageHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <header className="border-b-[0.5px] border-border px-8 pb-8 pt-20">
      <div className="mx-auto max-w-5xl">
        <h1 className="font-pixel-grid text-3xl font-light tracking-tight sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-4 max-w-2xl text-lg leading-relaxed tracking-tight text-foreground/80">
            {description}
          </p>
        ) : null}
      </div>
    </header>
  );
}
