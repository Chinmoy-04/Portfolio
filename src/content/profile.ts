/*
  Who you are. Used by the nav, hero, About, Stack, Contact and page metadata.
  Draft copy lives in docs/projects-draft.md.
*/

export const profile = {
  name: "Chinmoy Jyoti Bora",
  roleShort: "AI and ML engineer",
  roleLine: "AI agents, on-device vision, and RAG you can evaluate.",
  openTo: "Looking for Werkstudent and internship roles in ML, data engineering and AI software.",
  location: "Deggendorf, Germany",
  about: [
    "I build AI agents and agentic process automation, train compact vision models for real hardware, and turn messy data into systems you can query, evaluate and trust.",
    "My work runs from human-in-the-loop agent workflows to YOLO on a Raspberry Pi and retrieval pipelines that are scored, not guessed.",
  ],
  /** Newest first. `to: null` marks the current one, drawn in the accent colour. */
  education: [
    {
      from: "Mar 2026",
      to: null,
      degree: "M.Sc. Artificial Intelligence and Data Science",
      school: "TH Deggendorf, Germany",
      note: "Dual degree with the University of South Bohemia, Czech Republic",
      focus: "Machine learning, data engineering, AI systems",
    },
    {
      from: "Sep 2021",
      to: "Apr 2024",
      degree: "B.Sc. Information Technology",
      school: "St. Xavier's College, Mumbai (University of Mumbai), India",
      note: null,
      focus: "AI, cloud computing, big data, data mining, network security",
    },
  ] as {
    from: string;
    to: string | null;
    degree: string;
    school: string;
    note: string | null;
    focus: string;
  }[],

  links: {
    email: "chinmoy.bora177@gmail.com",
    github: "https://github.com/Chinmoy-04",
    linkedin: "https://www.linkedin.com/in/chinmoy-jyoti-bora-38787b227",
    /** The one-page CV in public/. Set to null to hide every CV link. */
    cv: "/Chinmoy-Jyoti-Bora-CV.pdf" as string | null,
  },

  stack: [
    {
      group: "ML and vision",
      items: ["PyTorch", "scikit-learn", "DINOv2", "Ultralytics YOLO", "OpenCV", "timm"],
    },
    {
      group: "LLM, RAG and agents",
      items: [
        "LangGraph",
        "LlamaIndex",
        "LightRAG",
        "Ragas",
        "Ollama",
        "Chroma",
        "FastAPI",
        "Node.js",
      ],
    },
    {
      group: "Frontend and data",
      items: ["React", "Next.js", "TypeScript", "Tailwind", "SQL", "R and tidyverse", "BigQuery"],
    },
    {
      group: "Hardware",
      items: ["Raspberry Pi", "NVIDIA"],
    },
  ],
} as const;
