/*
  THE project data file.

  The hero chapters, the project list, /work and the progress rail all read
  from the `projects` array below. Order in the array is order on the site.

  To add a project:
    1. Add one entry to the array.
    2. For a hero chapter, add a `hero` block. `{ kind: "text" }` needs no
       artwork: the particles form the project's name.
    3. For a custom emblem, put an SVG in public/emblems/ and point `src` at it.

  Only real numbers go in `metrics`. Leave it out until you have them.
*/

export type ProjectDomain = "agents" | "vision" | "rag" | "data";

export type Emblem =
  | { kind: "svg"; src: string; depth?: number }
  | { kind: "glb"; src: string }
  | { kind: "generator"; id: string }
  | { kind: "text" };

export type Project = {
  /** Used in URLs and anchors, e.g. #p-subspacead */
  slug: string;
  name: string;
  /** Shown in the hero chapter and the collapsed row */
  oneLine: string;
  year: number;
  domain: ProjectDomain;
  /** e.g. "Solo build", "Hackathon team" */
  role?: string;
  /** Two to four sentences, shown when the row expands */
  summary: string;
  /** Two to four bullets: what it does, what was hard */
  highlights?: string[];
  metrics?: { label: string; value: string }[];
  stack: string[];
  links: { repo?: string; demo?: string; paper?: string };
  /** Omit to keep a project out of the hero */
  hero?: {
    emblem: Emblem;
    /** Which part of the emblem glows in the accent colour */
    accentRegion?: string;
  };
};

export const domainLabels: Record<ProjectDomain, string> = {
  agents: "Agents",
  vision: "Vision",
  rag: "RAG",
  data: "Data",
};

export const projects: Project[] = [
  {
    slug: "subspacead",
    name: "SubspaceAD",
    oneLine: "Training-free few-shot anomaly detection with DINOv2 subspace modelling.",
    year: 2026,
    domain: "vision",
    summary:
      "A from-scratch reproduction of the SubspaceAD paper on MVTec-AD and VisA, for k in {1, 2, 4} shots across 5 seeds, with the paper's ablations and a web demo.",
    stack: ["Python", "PyTorch", "DINOv2", "FastAPI", "Next.js"],
    links: {
      repo: "https://github.com/Chinmoy-04/Subspacead",
      demo: "https://subspacead.vercel.app",
      paper: "https://arxiv.org/abs/2602.23013",
    },
    hero: {
      emblem: { kind: "svg", src: "/emblems/subspacead.svg" },
      accentRegion: "anomaly",
    },
  },
  {
    slug: "shopcrew",
    name: "ShopCrew",
    oneLine:
      "Agents that refund customers and pay suppliers through PayPal, with every decision reviewed in a control room.",
    year: 2026,
    domain: "agents",
    summary:
      "Agents run a one-person shop: refunds go through the PayPal Agent Toolkit and supplier payments through PayPal Payouts. Each decision lands in a live AG Grid control room where the owner can approve, edit or roll it back. Built for the PayPal AI Hackathon.",
    stack: ["TypeScript", "Node.js", "Fastify", "React", "AG Grid", "PayPal Agent Toolkit"],
    links: { repo: "https://github.com/Chinmoy-04/ShopCrew-PayPal" },
    hero: {
      emblem: { kind: "generator", id: "agent-graph" },
      accentRegion: "pending-node",
    },
  },
  {
    slug: "paintops",
    name: "PaintOps",
    oneLine: "Agentic investigation of quality deviations in an automotive paint shop.",
    year: 2026,
    domain: "agents",
    summary:
      "Investigates synthetic paint-shop quality events using LangGraph, retrieval over documents and SQL over process data, and ends in action tickets that a human approves.",
    stack: ["Python", "LangGraph", "RAG", "SQL"],
    links: { repo: "https://github.com/Chinmoy-04/paintops" },
    hero: {
      emblem: { kind: "svg", src: "/emblems/paintops.svg" },
      accentRegion: "defect",
    },
  },
  {
    slug: "rag-eval-engine",
    name: "RAG Eval Engine",
    oneLine:
      "Ingest documents, generate synthetic Q&A, score RAG pipelines with Ragas, and compare runs.",
    year: 2026,
    domain: "rag",
    summary:
      "A production-style evaluation engine for retrieval pipelines: document ingestion, synthetic question generation, Ragas scoring, and a dashboard for comparing configurations.",
    stack: ["Ragas"],
    links: {
      repo: "https://github.com/Chinmoy-04/Rag-eval-engine",
      demo: "https://rag-eval-engine.vercel.app",
    },
    hero: {
      emblem: { kind: "generator", id: "score-gauge" },
      accentRegion: "needle",
    },
  },
  {
    slug: "air-gesture-controller",
    name: "Air Gesture Controller",
    oneLine:
      "Touchless hand-gesture control running YOLO11n on a Raspberry Pi 5 camera's neural processor.",
    year: 2026,
    domain: "vision",
    summary:
      "A real-time gesture controller using YOLO11n on the Sony IMX500 NPU of a Raspberry Pi 5. Controls presentations, media, the cursor and the desktop from the camera alone.",
    stack: ["Python", "Ultralytics YOLO11n", "Sony IMX500", "Raspberry Pi 5"],
    links: { repo: "https://github.com/Chinmoy-04/air-gesture-controller" },
    hero: {
      emblem: { kind: "generator", id: "hand-skeleton" },
      accentRegion: "fingertips",
    },
  },
  {
    slug: "lightrag-local",
    name: "LightRAG Local",
    oneLine: "Bootstrap a local LightRAG knowledge graph that runs entirely on Ollama.",
    year: 2026,
    domain: "rag",
    summary: "Bootstraps a local LightRAG knowledge graph with Ollama.",
    stack: ["LightRAG", "Ollama", "JavaScript"],
    links: { repo: "https://github.com/Chinmoy-04/lightrag-local" },
    hero: {
      emblem: { kind: "generator", id: "knowledge-graph" },
      accentRegion: "hub",
    },
  },
  {
    slug: "german-air",
    name: "German Air",
    oneLine:
      "NO2 and PM10 air pollution against respiratory mortality across Germany's 16 states, 2019 to 2023.",
    year: 2026,
    domain: "data",
    summary:
      "An analysis of air pollution versus age-standardised respiratory mortality for all 16 German states, done in R notebooks and presented in an interactive Next.js dashboard.",
    stack: ["R", "tidyverse", "Next.js", "TypeScript"],
    links: {
      repo: "https://github.com/Chinmoy-04/German-air",
      demo: "https://german-air.vercel.app",
    },
    hero: {
      emblem: { kind: "svg", src: "/emblems/german-air.svg" },
      accentRegion: "states",
    },
  },
];

/** Projects that get a hero chapter, in order. */
export const heroProjects = projects.filter((p) => p.hero);
