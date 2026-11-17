# Project copy, first draft

Source: your public GitHub repositories and profile README, read on 16 Nov 2026.
Everything here is a draft for you to correct. Anything marked **CONFIRM** is a guess or a gap.
No metrics are included yet: only real numbers you supply will go on the site.

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
- **Metrics:** **CONFIRM** (e.g. image-level AUROC on MVTec-AD at k=4, and how close it is to the paper)
- **Year:** 2026

## 2. ShopCrew

- **Slug:** `shopcrew`
- **Domain:** agents
- **One line:** Autonomous agents that refund customers and pay suppliers through PayPal, with every decision reviewed in a control room.
- **Summary:** Agents run a one-person shop: refunds go through the PayPal Agent Toolkit and supplier payments through PayPal Payouts. Each decision lands in a live AG Grid control room where the owner can approve, edit or roll it back. Built for the PayPal AI Hackathon.
- **Stack:** TypeScript, Node.js, Fastify, React, AG Grid, PayPal Agent Toolkit
- **Repo:** https://github.com/Chinmoy-04/ShopCrew-PayPal
- **Demo:** none listed. **CONFIRM** if there is a video or hosted demo
- **Hero emblem:** a five-node agent graph with one node paused for approval
- **Role:** **CONFIRM** solo or team, and any hackathon result
- **Year:** 2026

## 3. PaintOps

- **Slug:** `paintops`
- **Domain:** agents
- **One line:** Agentic investigation of quality deviations in an automotive paint shop.
- **Summary:** Investigates synthetic paint-shop quality events using LangGraph, retrieval over documents and SQL over process data, and ends in action tickets that a human approves.
- **Stack:** Python, LangGraph, RAG, SQL. **CONFIRM** the vector store and model used
- **Repo:** https://github.com/Chinmoy-04/paintops
- **Demo:** none listed
- **Hero emblem:** a car body silhouette with a flagged defect patch
- **Year:** 2026

## 4. RAG Eval Engine

- **Slug:** `rag-eval-engine`
- **Domain:** rag
- **One line:** Ingest documents, generate synthetic Q&A, score RAG pipelines with Ragas, and compare runs in a dashboard.
- **Summary:** A production-style evaluation engine for retrieval pipelines: document ingestion, synthetic question generation, Ragas scoring, and a dashboard for comparing configurations.
- **Stack:** Ragas. **CONFIRM** the rest (LlamaIndex, Chroma, FastAPI?)
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
- **Metrics:** **CONFIRM** (frames per second on device, number of gestures)
- **Year:** 2026

## 6. LightRAG Local

- **Slug:** `lightrag-local`
- **Domain:** rag
- **One line:** Bootstrap a local LightRAG knowledge graph that runs entirely on Ollama.
- **Summary:** **CONFIRM**. The repository description is one line; I need two or three sentences on what it sets up and why it is useful.
- **Stack:** LightRAG, Ollama, JavaScript
- **Repo:** https://github.com/Chinmoy-04/lightrag-local
- **Demo:** none listed
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
- **Metrics:** **CONFIRM** the headline finding in one sentence
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
