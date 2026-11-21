/*
  THE project data file.

  The hero chapters, the project list, /work and the progress rail all read
  from the `projects` array below. Order in the array is order on the site.

  To add a project:
    1. Copy the template below into the array.
    2. For a hero chapter, keep the `hero` block; delete it to list the
       project only. `{ kind: "text" }` needs no artwork: the particles form
       the project's name.
    3. For a custom emblem, copy public/emblems/_template.svg to
       public/emblems/<slug>.svg, draw it, and point `src` at it.
    4. Run `npm run check:projects` (it also runs before every build).

  Only real numbers go in `metrics`. Leave it out until you have them.

  Template:

  {
    slug: "my-project",
    name: "My Project",
    oneLine: "One sentence on what it does.",
    year: 2026,
    domain: "vision",
    summary: "Two to four sentences.",
    stack: ["Python"],
    links: { repo: "https://github.com/Chinmoy-04/my-project" },
    hero: {
      emblem: { kind: "svg", src: "/emblems/my-project.svg" },
      accentRegion: "accent",
    },
  },
*/

import type { GeneratorId } from "@/engine/particles/generators";

export type ProjectDomain = "agents" | "vision" | "rag" | "data";

export type Emblem =
  | { kind: "svg"; src: string; depth?: number }
  | { kind: "glb"; src: string }
  | { kind: "generator"; id: GeneratorId }
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
    // From results/results.json in the SubspaceAD repo (mean over 5 seeds).
    metrics: [
      { label: "MVTec-AD image AUROC, 4-shot (paper 98.0)", value: "97.4" },
      { label: "VisA image AUROC, 4-shot (paper 94.7)", value: "94.0" },
      { label: "MVTec-AD pixel AUROC, 4-shot (paper 97.9)", value: "97.9" },
      { label: "Points below the paper, image AUROC", value: "0.6 to 1.4" },
    ],
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
    role: "Solo build",
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
    // From evaluation/last_results.json: 16 synthetic labelled cases, no vision model.
    metrics: [
      { label: "Routing accuracy, 16 synthetic cases", value: "1.0" },
      { label: "SOP recall@3", value: "1.0" },
      { label: "Tickets without approval", value: "0" },
    ],
    stack: [
      "Python",
      "LangGraph",
      "LlamaIndex",
      "Chroma",
      "Ollama (Qwen2.5 3B)",
      "n8n",
      "FastAPI",
      "SQLite",
      "Streamlit",
    ],
    links: { repo: "https://github.com/Chinmoy-04/paintops" },
    hero: {
      emblem: { kind: "svg", src: "/emblems/options/paintops-spray.svg" },
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
    // From run 5 in data/rag_eval.db: 20 curated questions (written without an LLM), all seven pipelines.
    metrics: [
      { label: "Pipelines compared", value: "7" },
      { label: "Context recall, hybrid+", value: "0.73 to 0.91" },
      { label: "Faithfulness, hybrid+", value: "0.55 to 0.64" },
      { label: "Curated test questions, 86-doc corpus", value: "20" },
    ],
    stack: [
      "Python",
      "FastAPI",
      "LlamaIndex",
      "Chroma",
      "BM25",
      "Ragas",
      "Ollama (Llama 3.1 8B judge)",
      "LiteLLM",
      "SQLite",
      "React",
    ],
    links: {
      repo: "https://github.com/Chinmoy-04/Rag-eval-engine",
      demo: "https://rag-eval-engine.vercel.app",
    },
    hero: {
      emblem: { kind: "generator", id: "score-radar" },
      accentRegion: "scores",
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
    // From the repo README on GitHub (checked 21 Nov 2026).
    metrics: [
      { label: "Gestures", value: "6" },
      { label: "On-device frame rate", value: "15 FPS" },
      { label: "Precision", value: "95.9%" },
      { label: "mAP50", value: "98.1%" },
    ],
    stack: ["Python", "Ultralytics YOLO11n", "Sony IMX500", "Raspberry Pi 5"],
    links: { repo: "https://github.com/Chinmoy-04/air-gesture-controller" },
    hero: {
      emblem: { kind: "svg", src: "/emblems/options/air-gesture-controller-palm.svg" },
      accentRegion: "fingertips",
    },
  },
  {
    slug: "lightrag-local",
    name: "LightRAG Local",
    oneLine:
      "The LightRAG graph-RAG paper reproduced on an 8 GB laptop GPU, with four retrieval modes compared side by side.",
    year: 2026,
    domain: "rag",
    summary:
      "A local reproduction of the LightRAG paper on native Windows. An 8B model on Ollama builds a knowledge graph from about 30 recent arXiv papers on RAG, and a React UI lets you chat in each retrieval mode, explore the graph and compare the modes with an LLM judge. It is a research tool for seeing where a small local setup falls short of the paper.",
    highlights: [
      "Four query modes (naive, local, global, hybrid) compared on one prompt, scored 1 to 10 on the paper's axes: comprehensiveness, diversity and empowerment.",
      "Resumable indexing with a run lock and an LLM cache, tuned for 8 GB of VRAM; a full index took about 20 to 25 hours.",
      "Honest finding: naive RAG beat the graph modes on this corpus, most likely because an 8B model extracted the graph.",
      "Answering and extraction models are configured separately, so a cloud model can answer while the graph is built locally.",
    ],
    metrics: [
      { label: "Graph", value: "6.5k nodes, 6.9k edges" },
      { label: "Corpus", value: "~30 arXiv papers" },
      { label: "Global query", value: "26 min to 4 s" },
      { label: "GPU", value: "8 GB VRAM" },
    ],
    stack: ["Python", "LightRAG", "Ollama", "Llama 3.1 8B", "NetworkX", "FastAPI", "React"],
    links: {
      repo: "https://github.com/Chinmoy-04/lightrag-local",
      paper: "https://arxiv.org/abs/2410.05779",
    },
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
    role: "Course project, team of three",
    summary:
      "An analysis of air pollution versus age-standardised respiratory mortality for all 16 German states, done in R notebooks and presented in an interactive Next.js dashboard.",
    // From german-air.vercel.app (checked 21 Nov 2026): Pearson r over 16 states x 5 years.
    metrics: [
      { label: "NO₂ vs age-standardised mortality", value: "r +0.31" },
      { label: "Same data, crude death rates", value: "r −0.29" },
      { label: "States × years", value: "16 × 5" },
    ],
    stack: ["R", "tidyverse", "Next.js", "TypeScript"],
    links: {
      repo: "https://github.com/Chinmoy-04/German-air",
      demo: "https://german-air.vercel.app",
    },
    hero: {
      emblem: { kind: "svg", src: "/emblems/options/german-air-hexbin.svg" },
      accentRegion: "states",
    },
  },
  {
    slug: "bottle-inspection",
    name: "Industrial Bottle Inspection",
    oneLine:
      "Reusable or not: a bottle classifier for returnable-bottle lines, built for the 1st Krones Vision AI Challenge on Kaggle.",
    year: 2026,
    domain: "vision",
    summary:
      "A binary classifier that decides whether a bottle on a conveyor is reusable. Each frame is cropped to the bottle's annotated region, then scored by an ensemble of two backbones, with the decision threshold tuned for F1 rather than fixed at 0.5.",
    highlights: [
      "ConvNeXt-Large and EfficientNetV2-M trained over stratified folds with EMA, MixUp/CutMix and a soft-target focal loss.",
      "Out-of-fold probabilities set the ensemble threshold; inference averages 12 TTA views across every checkpoint.",
      "Fit to Kaggle's 12-hour GPU budget for training, inference and ONNX export, with pause and resume for long local runs.",
    ],
    // The repo ships code only; no leaderboard or validation scores are published.
    stack: ["Python", "PyTorch", "timm", "ConvNeXt", "EfficientNetV2", "ONNX", "Ultralytics YOLO"],
    links: { repo: "https://github.com/Chinmoy-04/Industrial-Bottle-Inspection-System-Binary-" },
  },
];

/** Projects that get a hero chapter, in order. */
export const heroProjects = projects.filter((p) => p.hero);
