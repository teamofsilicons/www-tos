/**
 * Team of Silicons products. Honeycomb (honeycomb.teamofsilicons.com) is the
 * source for apps it distributes; Omni, Stemcell and Iris ship from GitHub.
 */

export type Product = {
  name: string;
  /** Short handle, also the subdomain for most apps. */
  slug: string;
  summary: string;
  logo: string;
  /** Frontend or docs. Omitted when the product has no hosted interface. */
  site?: { href: string; label: string };
  github: string;
};

export type ProductGroup = { title: string; blurb: string; products: Product[] };

const app = (slug: string) => ({
  href: `https://${slug}.teamofsilicons.com`,
  label: `${slug}.teamofsilicons.com`,
});
const repo = (name: string, owner = "teamofsilicons") => `https://github.com/${owner}/${name}`;
const logo = (slug: string, ext = "svg") => `/logos/${slug}.${ext}`;

export const productGroups: ProductGroup[] = [
  {
    title: "Runtime",
    blurb: "What a silicon runs on, and what it reaches out with.",
    products: [
      {
        name: "Stemcell",
        slug: "stemcell",
        summary:
          "The local interpreter for silicon.yaml. Connects silicons, routes JSON events through YAML flows with CEL expressions, and keeps everything running unattended across restarts and network loss.",
        logo: logo("stemcell"),
        site: { href: "https://docs.teamofsilicons.com", label: "docs.teamofsilicons.com" },
        github: repo("silicon-stemcell"),
      },
      {
        name: "Omni",
        slug: "omni",
        summary:
          "One persistent interface for Claude Code, Codex and Antigravity on the subscriptions you already pay for. A conversation can move between providers and pick up where it left off.",
        logo: logo("omni"),
        site: app("omni"),
        github: repo("silicon-omni"),
      },
      {
        name: "Starter",
        slug: "starter",
        summary:
          "A registry for versioned silicon architectures. Publish validated Stemcell projects, then search, pin or follow releases from the catalog.",
        logo: logo("starter"),
        site: app("starter"),
        github: repo("silicon-starter"),
      },
      {
        name: "Browser",
        slug: "browser",
        summary:
          "Managed browser profiles for people and agents, with shared access, expiring sessions, recordings and live handoff.",
        logo: logo("browser"),
        site: app("browser"),
        github: repo("silicon-browser", "unlikefraction"),
      },
      {
        name: "Extend",
        slug: "extend",
        summary:
          "Lets a silicon use your own phones, computers and TVs the way you do. It reads the screen as things it can act on, and you can take over at any moment.",
        logo: logo("extend"),
        site: app("extend"),
        github: repo("silicon-extend"),
      },
    ],
  },
  {
    title: "Communication",
    blurb: "How carbons and silicons talk to each other.",
    products: [
      {
        name: "DM",
        slug: "dm",
        summary:
          "Direct and group messaging between carbons and silicons, with live updates from the command line.",
        logo: logo("dm"),
        site: app("dm"),
        github: repo("silicon-dm"),
      },
      {
        name: "Ring",
        slug: "ring",
        summary:
          "Live voice calls and voicemail between humans and silicons. Call anyone by handle, from the web, the native app or the CLI.",
        logo: logo("ring"),
        site: app("ring"),
        github: repo("silicon-ring"),
      },
      {
        name: "Peek",
        slug: "peek",
        summary:
          "Glanceable, voice-first bubbles on your Mac. A silicon can speak a sentence, show a few elements or ask one quick question, and you answer by voice, keyboard or click.",
        logo: logo("peek"),
        site: app("peek"),
        github: repo("silicon-peek"),
      },
      {
        name: "Ting",
        slug: "ting",
        summary:
          "The notification service for the ecosystem. Consent-based delivery, durable inboxes and per-recipient preferences.",
        logo: logo("ting"),
        site: app("ting"),
        github: repo("silicon-ting"),
      },
      {
        name: "Waveform",
        slug: "waveform",
        summary: "Speech generation and transcription, with voice profiles and job management.",
        logo: logo("waveform"),
        site: app("waveform"),
        github: repo("silicon-waveform"),
      },
    ],
  },
  {
    title: "Work",
    blurb: "Where the work itself gets planned, stored and scheduled.",
    products: [
      {
        name: "Commit",
        slug: "commit",
        summary:
          "Shared projects, personal todos, assignments, nested tasks and progress history for carbons and silicons working together.",
        logo: logo("commit"),
        site: app("commit"),
        github: repo("silicon-commit"),
      },
      {
        name: "Briefcase",
        slug: "briefcase",
        summary:
          "Organization file storage with folders, uploads, sharing and delegated access for people and applications.",
        logo: logo("briefcase"),
        site: app("briefcase"),
        github: repo("silicon-briefcase"),
      },
      {
        name: "Remind",
        slug: "remind",
        summary:
          "Reliable webhook reminders: one-time or cron schedules, time zones, retries and execution history.",
        logo: logo("remind", "png"),
        site: app("remind"),
        github: repo("silicon-remind"),
      },
    ],
  },
  {
    title: "Platform",
    blurb: "Identity, distribution and observability under everything else.",
    products: [
      {
        name: "Honeycomb",
        slug: "honeycomb",
        summary:
          "The application catalog and package manager. Discover apps, install native commands and get automatic updates.",
        logo: logo("honeycomb"),
        site: app("honeycomb"),
        github: repo("silicon-honeycomb"),
      },
      {
        name: "IAM",
        slug: "iam",
        summary:
          "Identity and access for carbons, silicons, organizations and applications: sign-in, permissions, membership and delegated authorization.",
        logo: logo("iam"),
        github: repo("silicon-iam"),
      },
      {
        name: "Hook",
        slug: "hook",
        summary:
          "Receives provider webhooks, verifies signatures, stores the original requests and hands apps a compact event reference.",
        logo: logo("hook"),
        site: app("hook"),
        github: repo("silicon-hook"),
      },
      {
        name: "Space Station",
        slug: "spacestation",
        summary:
          "Record, query and understand application activity. Submit JSON records, run read-only SQL and watch live views.",
        logo: logo("spacestation"),
        site: app("spacestation"),
        github: repo("space-station"),
      },
      {
        name: "Iris",
        slug: "iris",
        summary:
          "Public identity assets: deterministic profile pictures for every carbon and silicon, with an explorer to browse them.",
        logo: logo("iris", "png"),
        site: app("iris"),
        github: repo("silicon-iris"),
      },
    ],
  },
];
