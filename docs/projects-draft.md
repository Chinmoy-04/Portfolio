# Project copy, first draft

Source: your public GitHub repositories and profile README, read on 16 Nov 2026.
Everything here is a draft for you to correct. Anything marked **CONFIRM** is a guess or a gap.
Only real numbers go on the site. Metrics and stacks were filled in from the project folders on D: on 21 Nov 2026.

Order below is the order on the site.

---

## 1. SubspaceAD

- **Slug:** `subspacead`
- **Domain:** vision
- **One line:** Training-free few-shot anomaly detection with DINOv2 subspace modelling.
- **Summary:** A from-scratch reproduction of the SubspaceAD paper (arXiv:2602.23013) on MVTec-AD and VisA, for k in {1, 2, 4} shots across 5 seeds, with the paper's ablations and a web demo.
- **Stack:** Python, PyTorch, DINOv2, FastAPI, Next.js
- **Repo:** https://github.com/Chinmoy-04/Subspacead
- **Demo:** https://subspacead.vercel.app
- **Paper:** https://arxiv.org/abs/2602.23013
- **Hero emblem:** an industrial part with one patch glowing as the anomaly
- **Metrics (from `D:\SubspaceAD\results\results.json`, 21 Nov 2026):** image AUROC at 4 shots 97.4 on MVTec-AD (paper 98.0) and 94.0 on VisA (paper 94.7); pixel AUROC 97.9 on MVTec-AD (paper 97.9); image AUROC within 0.6 to 1.4 points of the paper at every k.
- **Year:** 2026

## 2. ShopCrew

- **Slug:** `shopcrew`
- **Domain:** agents
- **One line:** Autonomous agents that refund customers and pay suppliers through PayPal, with every decision reviewed in a control room.
- **Summary:** Agents run a one-person shop: refunds go through the PayPal Agent Toolkit and supplier payments through PayPal Payouts. Each decision lands in a live AG Grid control room where the owner can approve, edit or roll it back. Built for the PayPal AI Hackathon.
- **Stack:** TypeScript, Node.js, Fastify, React, AG Grid, PayPal Agent Toolkit
- **Repo:** https://github.com/Chinmoy-04/ShopCrew-PayPal
- **Demo:** none found on D: (no video link or hosted URL; the repo has a Render config). **CONFIRM** if there is one
- **Hero emblem:** a five-node agent graph with one node paused for approval
- **Role:** solo build (confirmed 21 Nov 2026). Hackathon judging ends 15 Dec 2026, so no result yet
- **Year:** 2026

## 3. PaintOps

- **Slug:** `paintops`
- **Domain:** agents
- **One line:** Agentic investigation of quality deviations in an automotive paint shop.
- **Summary:** Investigates synthetic paint-shop quality events using LangGraph, retrieval over documents and SQL over process data, and ends in action tickets that a human approves.
- **Stack:** Python, LangGraph, LlamaIndex, Chroma, Ollama (Qwen2.5 3B by default), all-MiniLM-L6-v2 embeddings, n8n, FastAPI, SQLite, Streamlit
- **Metrics (from `evaluation/last_results.json`):** 16 synthetic labelled cases; classification and routing accuracy 1.0, SOP recall@3 1.0, 0 tickets without approval. Synthetic set only, no vision model
- **Repo:** https://github.com/Chinmoy-04/paintops
- **Demo:** a demo GIF in the repo (`docs/demo.gif`), no video
- **Hero emblem:** a car body silhouette with a flagged defect patch
- **Year:** 2026

## 4. RAG Eval Engine

- **Slug:** `rag-eval-engine`
- **Domain:** rag
- **One line:** Ingest documents, generate synthetic Q&A, score RAG pipelines with Ragas, and compare runs in a dashboard.
- **Summary:** A production-style evaluation engine for retrieval pipelines: document ingestion, synthetic question generation, Ragas scoring, and a dashboard for comparing configurations.
- **Stack:** Python, FastAPI, LlamaIndex, Chroma, BM25 hybrid retrieval, Ragas, LiteLLM, SQLite, React, Vite
- **Metrics (run 5 in `data/rag_eval.db`, 20 curated questions written without an LLM):** 7 pipelines compared; hybrid+ raised context recall from 0.73 (baseline) to 0.91 and faithfulness from 0.55 to 0.64
- **Models (checked 21 Nov 2026):** answers from `gpt-oss-20b` on Groq; Ragas scoring by a local Llama 3.1 8B judge on Ollama. Both the README and the CV are right
- **Repo:** https://github.com/Chinmoy-04/Rag-eval-engine
- **Demo:** https://rag-eval-engine.vercel.app
- **Hero emblem:** stacked document pages collapsing into a score gauge
- **Year:** 2026

## 5. Air Gesture Controller

- **Slug:** `air-gesture-controller`
- **Domain:** vision
- **One line:** Touchless hand-gesture control running YOLO11n on a Raspberry Pi 5 camera's neural processor.
- **Summary:** A real-time gesture controller using YOLO11n on the Sony IMX500 NPU of a Raspberry Pi 5. Controls presentations, media, the cursor and the desktop from the camera alone.
- **Stack:** Python, Ultralytics YOLO11n, Sony IMX500, Raspberry Pi 5
- **Repo:** https://github.com/Chinmoy-04/air-gesture-controller
- **Demo:** none listed. **CONFIRM** if there is a video; this project benefits most from one
- **Hero emblem:** a hand skeleton with 21 keypoints
- **Metrics (repo README on GitHub, checked 21 Nov 2026):** 6 gestures; 95.9% precision, 96.9% recall, 98.1% mAP50; 15 FPS on the Pi with inference on the IMX500's NPU. Built as an Embedded AI course project at TH Deggendorf
- **Year:** 2026

## 6. LightRAG Local

- **Slug:** `lightrag-local`
- **Domain:** rag
- **One line:** The LightRAG graph-RAG paper reproduced on an 8 GB laptop GPU, with four retrieval modes compared side by side.
- **Summary:** A local reproduction of the LightRAG paper on native Windows. An 8B model on Ollama builds a knowledge graph from about 30 recent arXiv papers on RAG, and a React UI lets you chat in each retrieval mode, explore the graph and compare the modes with an LLM judge. It is a research tool for seeing where a small local setup falls short of the paper.
- **Highlights:** four query modes compared and judged on the paper's axes; resumable, locked, cached indexing tuned for 8 GB VRAM (20 to 25 h full run); naive RAG beat the graph modes, likely because of 8B extraction; answer and extraction models configured separately.
- **Metrics:** 6.5k nodes and 6.9k edges; ~30 arXiv papers; global query 26 min to 4 s after switching the answer model to DeepSeek; 8 GB VRAM.
- **Stack:** Python, LightRAG, Ollama, Llama 3.1 8B, NetworkX, FastAPI, React
- **Repo:** https://github.com/Chinmoy-04/lightrag-local
- **Paper:** https://arxiv.org/abs/2410.05779
- **Demo:** none hosted (a 40-second video is in the repo)
- **Hero emblem:** a knowledge graph of linked nodes
- **Year:** 2026

## 7. German Air

- **Slug:** `german-air`
- **Domain:** data
- **One line:** NO2 and PM10 air pollution against respiratory mortality across Germany's 16 states, 2019 to 2023.
- **Summary:** An analysis of air pollution versus age-standardised respiratory mortality for all 16 German states, done in R notebooks and presented in an interactive Next.js dashboard.
- **Stack:** R, tidyverse, Next.js, TypeScript
- **Repo:** https://github.com/Chinmoy-04/German-air
- **Demo:** https://german-air.vercel.app
- **Hero emblem:** the outline of Germany with some states shaded
- **Role:** course project, built with two teammates
- **Finding (from german-air.vercel.app, 21 Nov 2026):** after age-standardisation, NO₂ tracks respiratory mortality across the 16 states (Pearson r +0.31), while crude rates point the other way (r −0.29). Site design and build by you; research with Adham Abdelhalim and Odinaka Obioha
- **Year:** 2026

---

## Profile copy

- **Name:** Chinmoy Jyoti Bora
- **Role line (draft):** AI agents, on-device vision, and RAG you can evaluate.
- **Open-to-work line:** Looking for Werkstudent and internship roles in ML, data engineering and AI software.
- **Location:** Deggendorf, Germany
- **Education line:** Dual-degree M.Sc. in AI and Data Science, TH Deggendorf and University of South Bohemia.
- **Links:** GitHub `Chinmoy-04`, LinkedIn `chinmoy-jyoti-bora-38787b227`, email as on your GitHub README.

## Stack section

- **ML and vision:** PyTorch, scikit-learn, DINOv2, Ultralytics YOLO, OpenCV, timm
- **LLM, RAG and agents:** LangGraph, LlamaIndex, LightRAG, Ragas, Ollama, Chroma, FastAPI, Node.js
- **Frontend and data:** React, Next.js, TypeScript, Tailwind, SQL, R and tidyverse, BigQuery
- **Hardware:** Raspberry Pi, NVIDIA
