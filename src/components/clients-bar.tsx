import Image from "next/image";

type Client = {
  name: string;
  logo?: string;
  href?: string;
  wide?: boolean;
};

const clients: Client[] = [
  { name: "Pawaac Drones" },
  { name: "Break Into VC" },
  { name: "Digitea" },
  { name: "Siddhannam" },
  { name: "Wock Oliver" },
];

function LogoTile({ client }: { client: Client }) {
  const tileClass =
    "flex h-full w-full items-center justify-center rounded-lg bg-[#F2F3EB] p-3 sm:p-4";

  const content = client.logo ? (
    <div
      className="relative w-full"
      style={{ aspectRatio: client.wide ? "4 / 1" : "2.5 / 1" }}
    >
      <Image
        src={client.logo}
        alt={client.name}
        fill
        className="object-contain object-center"
        sizes="(max-width: 768px) 45vw, 180px"
      />
    </div>
  ) : (
    <span className="text-center text-xs font-medium text-foreground/75 sm:text-sm">
      {client.name}
    </span>
  );

  if (client.href) {
    return (
      <a
        href={client.href}
        target="_blank"
        rel="noopener noreferrer"
        className={`${tileClass} min-h-16 transition-opacity hover:opacity-80 sm:min-h-20`}
      >
        {content}
      </a>
    );
  }

  return (
    <div className={`${tileClass} min-h-16 sm:min-h-20`}>{content}</div>
  );
}

export function ClientsBar() {
  return (
    <section className="flex min-h-[40vh] flex-col justify-center border-t-[0.5px] border-border px-8 pb-16 pt-16">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <h2 className="font-pixel-square text-lg uppercase tracking-tight">
          Deployed at
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {clients.map((client) => (
            <LogoTile key={client.name} client={client} />
          ))}
        </div>
      </div>
    </section>
  );
}
