export const integrationTools = [
  "Slack",
  "Notion",
  "GitHub",
  "Linear",
  "Jira",
  "Salesforce",
  "HubSpot",
  "QuickBooks",
  "Google Workspace",
  "Microsoft 365",
  "Figma",
  "PostHog",
  "Stripe",
  "Zendesk",
  "Intercom",
  "Airtable",
  "Asana",
  "Monday",
  "Confluence",
  "Datadog",
  "Snowflake",
  "Shopify",
  "Twilio",
  "Workday",
];

export const inHouseStack = [
  { name: "Orchestrator", description: "Coordinates silicons across divisions and tools." },
  { name: "Memory", description: "Persistent context that stays hot across every workflow." },
  { name: "Silicon Trust", description: "Six-level access control for anything inside your company." },
  { name: "Integrations Layer", description: "13,750+ tool connections with unified auth." },
  { name: "Deployment", description: "Runs on your cloud with keys only you hold." },
  { name: "Observability", description: "Audit trails, logs, and performance across every silicon." },
];

export const trustLevels = [
  {
    level: 1,
    name: "Public",
    description: "Read-only access to company-wide announcements and shared docs.",
    example: "A contractor sees the onboarding handbook, nothing else.",
  },
  {
    level: 2,
    name: "Team",
    description: "Access to a single division's workspace and shared channels.",
    example: "Marketing silicons can read campaign briefs but not finance ledgers.",
  },
  {
    level: 3,
    name: "Project",
    description: "Scoped to one initiative: files, threads, and tools for that project only.",
    example: "Product launch silicons see the PRD and Figma, not unrelated repos.",
  },
  {
    level: 4,
    name: "Resource",
    description: "Granular control on a specific asset: one doc, one database, one API.",
    example: "Finance silicon gets QuickBooks read-only; reimbursements need approval.",
  },
  {
    level: 5,
    name: "Action",
    description: "Permission to execute (send, deploy, purchase) within defined limits.",
    example: "Ops silicon can open tickets and ping owners, but cannot delete records.",
  },
  {
    level: 6,
    name: "Admin",
    description: "Full control including policy changes and key rotation.",
    example: "Your CTO approves architecture deploys and trust policy updates.",
  },
];

export const pricingFaqs = [
  {
    question: "Can I choose my own model provider?",
    answer:
      "Yes. Run your team of silicons with the model provider of your choice: OpenAI, Anthropic, Google, or self-hosted.",
  },
  {
    question: "Who owns my data?",
    answer:
      "You do. Silicons run on your cloud. Backups and messages are encrypted with keys only you hold.",
  },
  {
    question: "Can I cancel after the free period?",
    answer:
      "Yes. The first two months are $0. You are free to cancel anytime after that, with no lock-in beyond what your tier commits to.",
  },
  {
    question: "What is the difference between the two tiers?",
    answer:
      "$1,999/mo is the default annual plan, best value for teams going all-in for a year. $2,999/mo is month-to-month flexibility after the trial, with no annual commitment.",
  },
];

export type CaseStudy = {
  slug: string;
  division: string;
  headline: string;
  outcome: string;
  highlight?: string;
  body: string[];
};

export const caseStudies: CaseStudy[] = [
  {
    slug: "product",
    division: "Product",
    headline: "New product category, live in 28 hours",
    outcome: "PRD to deployed product with PM, marketing, and engineering in the loop.",
    highlight: "28 hours",
    body: [
      "Team of Silicons was tasked to work on a new product category that would bring more qualified leads to the main business.",
      "ToS involved PM to build the PRD, and looped in Marketing to set up conversion tracking with their existing product on PostHog. Tech silicons then built, quality checked, secured, and deployed the product in 28 hours while including Engineering to pass the architecture and deployment plans.",
    ],
  },
  {
    slug: "technology",
    division: "Technology",
    headline: "Multimodal edge vision for autonomous surveillance",
    outcome: "RGB + thermal fusion with analyst-ready intel alerts, not over-confident flags.",
    body: [
      "Team of Silicons was assigned to build a Vision Model for Autonomous Surveillance Drones to detect and flag troops in border dispute areas.",
      "ToS built a multimodal edge vision model, fusing RGB and thermal streams that detects and tracks objects across frames. Instead of one over-confident classifier, pairing a real-time edge detector (distilled) with a dedicated open-world layer that flags when evidence is inconclusive works better.",
      "Alerts land as intel on unverified person, vehicle, unrecognized object, or insufficient evidence for an analyst to judge.",
    ],
  },
  {
    slug: "marketing",
    division: "Marketing",
    headline: "117% increase in monthly orders",
    outcome: "Organic channels scaled after verbal and visual style was locked with branding.",
    highlight: "117%",
    body: [
      "Siddhannam tasked their Team of Silicons with increasing orders via organic marketing channels.",
      "ToS worked with their branding team to define the verbal and visual style. Then ToS started content channels via newsletters, Instagram Reels, and blogs. It identified that Google was the best converting channel, so it doubled down on SEO and connected with writers in the same niche to cross-post and build backlinks.",
      "After 3 months, monthly orders saw an increase of 117%.",
    ],
  },
  {
    slug: "sales",
    division: "Sales",
    headline: "50 enriched accounts, ready for outreach",
    outcome: "Navigator filters narrowed to warm paths via 1st and 2nd degree connections.",
    body: [
      "Team of Silicons was told to find qualifying leads in Bangalore.",
      "ToS opened LinkedIn Sales Navigator and using filters created a list of 500+ qualifying companies. Outreach silicon realized that was too many to meet in person, so it narrowed to the most relevant 50 where team members had 1st or 2nd degree connections.",
      "For each company in the list of 50, silicon enriched them and delivered a document with names, best contact person, details, address, what the company does, and how ToS could help.",
    ],
  },
  {
    slug: "finance",
    division: "Finance",
    headline: "Weekly cash flow reports to the CEO",
    outcome: "Silicon CFO on read-only books with invoice collection from the team.",
    body: [
      "Team of Silicons was assigned to be the Silicon CFO to manage budgets and keep runway in check.",
      "ToS connected to the company's current account on read-only permissions and QuickBooks. It then messaged every team member to send invoices and bills for future personal purchases eligible for reimbursement.",
      "ToS sent weekly cash flow reports to the CEO.",
    ],
  },
  {
    slug: "operations",
    division: "Operations",
    headline: "Problem resolution: 2 days to under 3 hours",
    outcome: "Chief of Staff silicon routing issues to the right division immediately.",
    highlight: "3 hours",
    body: [
      "Team of Silicons was brought in to reduce time to surface problems before they become serious.",
      "ToS deployed Chief of Staff silicon to oversee communications between team members and silicons. Any problem a team member had was immediately sent to a silicon in the division that could solve it. Silicon then involved team members to verify its solution.",
      "In a team of 45, ToS reduced problem resolution time from 2 days to less than three hours.",
    ],
  },
];

export function getCaseStudy(slug: string) {
  return caseStudies.find((study) => study.slug === slug);
}
