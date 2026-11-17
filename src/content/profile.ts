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
  education:
    "Dual-degree M.Sc. in AI and Data Science, TH Deggendorf and University of South Bohemia.",

  links: {
    email: "chinmoy.bora177@gmail.com",
    github: "https://github.com/Chinmoy-04",
    linkedin: "https://www.linkedin.com/in/chinmoy-jyoti-bora-38787b227",
    /** Set to "/cv.pdf" once the file is in public/. CV links stay hidden until then. */
    cv: null as string | null,
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
