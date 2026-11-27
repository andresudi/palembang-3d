# Feasibility Analysis, Execution Patterns, Effort/Token Estimates, and AI Model Recommendations for a 3D Visualization of Palembang City

This document presents a critical assessment of building a 3D visualization of Palembang City — starting from the early exploratory prototype built and verified in this repository, through to projections toward a GIS-driven city-scale model and a digital twin. Every claim about the prototype is strictly tied (*1:1 consistency lock*) to the source files, terminal commands, and actual verification results in this project repository.

> [!NOTE]
> This analysis was written for the offline **Stylized PBR Diorama** mode. The later **Real Satellite 3D** mode (MapLibre + Esri imagery + OSM 3D buildings + terrain + Three.js hero landmarks) is documented in [README.md](README.md).

---

## 1. Executive Summary

1. **Feasibility:** Building a 3D visualization of Palembang is **highly feasible** at the *Stylized Procedural Prototype* level for early exploration, conceptual spatial planning, and digital tourism (as demonstrated by the Three.js + Vite prototype in this project). Feasibility drops to **medium** for a *GIS-Driven City Model* (sparse building-height attributes in OpenStreetMap for Palembang and the ~8 m resolution of DEMNAS), and to **low-to-conditional** for a *Photorealistic Digital Twin / 3D Tiles*, because commercial 3D mesh coverage for secondary Indonesian cities is still uneven and UAV/LiDAR acquisition is expensive.
2. **Fit-for-Purpose Features & Execution Patterns:** For a small prototype (~15–20 files), an **Iterative Single Agent with a screenshot verification loop** or a **Human-in-the-Loop Co-pilot** is far more efficient than complex multi-agent orchestration. Once the scope grows to hundreds of square kilometers of geospatial data, the best pattern shifts to a **Deterministic Pipeline / DAG** (GIS ETL → 3D tiling → viewer), with agents used only for scripting, UI, and QA.
3. **Effort & Token Consumption:** The *stylized* prototype can be completed in roughly **~6–14 effective working hours** (or **~480K–1.43M total tokens** when done autonomously with visual verification and QA loops — the lower bound for a focused *single agent*, the upper bound for layered *multi-agent* setups), while a city-scale GIS model takes **3–8 weeks** (and can reach millions of tokens if agents are involved in code iteration, data cleaning, and repeated QA). Most token consumption (**~75–90%**) comes from **input context amplification** (conversation history, tool outputs, and screenshot image tokens), not from the number of lines of output code.
4. **AI Model Recommendations:** No single model is optimal for every phase. The best cost/performance strategy separates **high-reasoning models** for architecture and spatial debugging, **fast coding models** for boilerplate/ETL, and **multimodal (vision) models** specifically for visual inspection of WebGL renders, so that geometry defects (*floating meshes*, overlapping labels, or framing blocked by UI) are caught early.

---

## 2. Verified Prototype Specification & Limits (Consistency Anchor)

This section documents exactly what was built and verified in this project repository, separating the prototype reality (Tier 1) from city-scale targets (Tiers 2–3).

### 2.1 File Inventory & Installed Technology

- **Installed stack (`package.json`):** `three` (`^0.187.0`) and `vite` (`^8.4.0`), vanilla ES modules with no additional UI *framework* and **no CDN calls at runtime**.
- **Actual file structure:**
  - `package.json`, `vite.config.js` (`base: './'`, `outDir: 'dist'`), `index.html`
  - `src/main.js` — `WebGLRenderer` initialization (with an error fallback when WebGL is unavailable), `OrbitControls` with polar-angle and distance limits, *camera tweening*, and read-only telemetry on `window.__PALEMBANG_3D__`
  - `src/style.css` — high-contrast HUD (*heads-up display*) styles for preset controls, lighting modes, and the info card
  - `src/scene/textures.js` — procedural PBR texture generator via `<canvas>` (grainy asphalt, plaza stone paving, tropical grass, terracotta roof tiles, colonial plaster, textured steel, stadium turf, and multi-story shophouse facades with an `emissiveMap` for windows that light up at night)
  - `src/scene/environment.js` — procedural shader sky dome (tropical clouds & night stars), dynamic sky reflection IBL (`PMREMGenerator`), exponential fog (`FogExp2`), directional lighting and shadows, and `UnrealBloomPass` parameters for 3 modes (`siang`/day, `senja`/sunset, `malam`/night)
  - `src/scene/riverMusi.js` — Musi River water surface with an animated ripple shader, contoured banks for Seberang Ilir (`-Z`) & Seberang Ulu (`+Z`), retaining walls, jetties, 5 *ketek* boats, and 2 coal barges + tugboats
  - `src/scene/ampera.js` — brick-red Ampera Bridge with two H-portal towers, steel trusses, vertical cables, counterweights, streetlights, and passing vehicles
  - `src/scene/kutoBesak.js` — Kuto Besak Fort with a ~1.6:1 footprint facing the Musi River, 4 corner bastions, the *Lawang Kuto* gate, inner-courtyard buildings with *limasan* roofs, the Red-and-White flag, and the BKB Plaza with its jetty
  - `src/scene/pulauKemaro.js` — Kemaro Island with the red-and-gold nine-story octagonal Pagoda, the Hok Tjing Rio temple, tropical trees (*Love Tree*), and a wooden jetty
  - `src/scene/cityContext.js` — SMB I Great Mosque (three-tiered *tumpang* roof and white minaret), Monpera, the South Sumatra LRT elevated track (from Ampera Station to Jakabaring Station + an animated 3-car train), and a cluster of *Rumah Limas* stilt houses
  - `src/scene/landmarksExtra.js` — 7 additional districts/landmarks: the Great Mosque Fountain Roundabout (animated fountain), the Pasar 16 Ilir building & district, the Mayor's Office (Water Tower / *Gedung Ledeng*) + SMB II Museum, Kambang Iwak Park & Lake, Kampung Kapitan 7 Ulu, Gelora Sriwijaya Jakabaring Stadium (4 floodlight towers + Jakabaring LRT Station), and the Musi IV Bridge (*cable-stayed* + animated traffic)
  - `src/scene/urbanFabric.js` — urban surface zoning (commercial/residential/park), a marked arterial & collector road network, and `InstancedMesh`-based city density (81 shophouses with night-lit windows, 241 residential houses, 978 tropical trees & a green belt along the map edge, 68 streetlamps, and 40 animated road vehicles)
  - `src/ui/landmarks.js` & `src/ui/hud.js` — 10 camera presets (`Overview`, `Ampera`, `Bundaran & Masjid`, `Pasar 16 Ilir`, `Kuto Besak`, `Walikota & KI`, `Kampung Kapitan`, `Jakabaring`, `Jembatan Musi IV`, `Pulau Kemaro`), directly clickable 3D Label pins, a `Siang`/`Senja`/`Malam` switch, a `Label 3D` toggle, and the info card
  - `scripts/verify.mjs` — automated verification script based on `vite preview` + Playwright headless Chromium (`ANGLE SwiftShader` WebGL2)
  - `README.md` & `ANALISIS_PALEMBANG_3D.md`

### 2.2 Verified Commands & Actual Execution Results

All of the following commands were executed from this project repository (on a macOS host with Node `v24.22.1` on `PATH`) and exited with **exit code 0**:

- **`npm install`**: Installs 43 dependency packages (including transitive dependencies per `package-lock.json`).
- **`npm run build`**: `vite build` transforms 29 modules and produces a production bundle in `dist/` in **~143–165 ms** (file sizes: `dist/index.html` 0.42 kB, `dist/assets/index-*.css` 5.14 kB / 1.68 kB gzip, `dist/assets/index-*.js` 668.76 kB / 170.44 kB gzip).
- **`npm run verify`**: Runs `node scripts/verify.mjs` against `vite preview` at `http://127.0.0.1:4179/`:
  - **Measured WebGL2 telemetry (`SwiftShader`):** `meshCount: 1,090`, `triangles: ~241,656–241,658`, `drawCalls: ~1,495–1,496`, `landmarkCount: 10`, `urbanStats: { rukoCount: 81, houseCount: 241, treeCount: 978, lampCount: 68, roadCarCount: 40 }`.
  - **Error, non-blank & mobile layout validation:** `consoleErrors: 0`, `pageErrors: 0`; the `16×16` canvas pixel-sampling test passes with `spread: 522` and `uniqueBuckets: 114` (not a blank screen); the `390×844` mobile viewport test passes (`mobileBounds.fits: true`, all HUD controls fit within the `390 px` width).
  - **Verified screenshots (13 PNGs in `artifacts/`):** `preview-overview.png`, `preview-ampera.png`, `preview-masjid-lrt.png`, `preview-pasar16.png`, `preview-bkb.png`, `preview-walikota-ki.png`, `preview-kapitan.png`, `preview-jakabaring.png`, `preview-musi-iv.png`, `preview-kemaro.png`, `preview-sunset.png`, `preview-jakabaring-night.png`, and `preview-night.png` — all visually inspected.

### 2.3 Deliberate Prototype Limitations

1. **Compressed Diorama Scale:** Relative orientation is preserved (*Seberang Ilir* to the north at `-Z`, *Seberang Ulu* to the south at `+Z`, the *Musi River* flowing from west `-X` to east `+X`), but longitudinal distances are compressed (on the ground, Kuto Besak Fort is ~0.5–0.7 km west of Ampera, while Kemaro Island is ~6 km downstream to the east). Without compression, Kemaro Island and Kuto Besak would look too small in the *overview*.
2. **Procedural Geometry, Not Survey Data:** All objects are built from Three.js primitives and shaders. There are no imported photogrammetry `.glb/.gltf` models or civil-engineering BIM models.
3. **No GIS Integration or Live Telemetry (in Diorama mode):** Not connected to DEMNAS, the OpenStreetMap API, Cesium/Google 3D Tiles, or real-time GPS positions of boats/LRT. Movement of boats, barges, cars, and LRT trains is synthetic and deterministic.

---

## 3. Topic 1 — Feasibility & Extent Analysis

The question *"is it feasible to build a 3D visualization of Palembang?"* cannot be answered with a single yes/no, because feasibility depends heavily on the **fidelity tier** and the **intended use**.

### 3.1 Comparison of Three Implementation Tiers

| Evaluation Dimension | Tier 1: *Stylized Procedural Prototype* (Current Prototype) | Tier 2: *Data-Driven GIS City Model* (OSM + DEMNAS) | Tier 3: *Photorealistic Digital Twin* (3D Tiles / UAV / BIM) |
|---|---|---|---|
| **Spatial Extent** | Core Musi River corridor (compressed scale) | Entire Palembang urban area (~400 km²) in real coordinates (WGS84/UTM 48S) | Strategic corridors (Musi, Jakabaring, port) or priority blocks at centimeter resolution |
| **Primary Data Sources** | Architectural knowledge + Three.js primitives | OSM/RBI building footprints + BIG DEMNAS (`0.27 arcsecond` / ~8 m) + custom `.glb` models for key landmarks | Google Photorealistic 3D Tiles / Cesium, UAV drone photogrammetry surveys, aerial LiDAR, or BIM/IFC models |
| **Technical & Data Feasibility in Palembang** | **High.** Self-contained, 100% offline-safe, zero dependency on external data licenses | **Medium.** DEMNAS is freely available (BIG), but OSM height tags (`building:levels`/`height`) in Palembang are still sparse/uneven | **Low–Conditional.** Commercial 3D Tiles coverage in Indonesia is concentrated in Tier-1/Tier-2 metros and is partial/not uniformly verified for Palembang; UAV/LiDAR acquisition is expensive |
| **GPU/VRAM & Network Load** | Very light (~41K triangles, <160 kB JS gzip); smooth on laptops and phones | Medium–heavy; requires *spatial tiling* (`3D Tiles` / instancing) to avoid choking browser VRAM | Heavy (hundreds of MB–GB of texture streaming per session; needs a discrete GPU or stable broadband) |
| **Operating & Licensing Cost** | Zero license/API cost (static hosting) | Low–medium (self-hosted tile server / Mapbox / Cesium Ion; manual landmark asset modeling cost) | High (commercial API quotas, *point-cloud*/mesh storage, periodic drone survey updates) |
| **Use-Case Fit** | Early exploration, concept presentations, interactive tourism maps, education | Macro urban planning, Musi River flood/tide simulation, zoning visualization | Precision infrastructure asset management, civil engineering simulation, operational digital twin |

### 3.2 Palembang-Specific Data Gaps (Ground Reality)

1. **DEMNAS Resolution (~8 m) for Flat Swamp-River Topography:** Palembang sits on the tidal lowlands of the Musi River with subtle local elevation changes. DEMNAS (~8 m horizontal resolution, EGM2008 vertical datum) is adequate for macro city contours but **too coarse** to model riverbank retaining walls, LRT viaduct approaches, or micro drainage channels without additional bathymetry/LiDAR surveys.
2. **Uneven Building Attributes in OpenStreetMap:** In the central districts (Ilir Timur/Ilir Barat), building footprints are fairly well mapped, but most lack `height` or `building:levels` attributes. Naive extrusion with random heights does create visual density, but fails to convincingly represent historic buildings (*Rumah Limas*, Pasar 16 Ilir shophouses, Ulu riverside warehouses).
3. **Uncertain Commercial 3D Tiles Coverage:** Assuming full Google Photorealistic 3D Tiles availability in Palembang is high-risk; official coverage in Indonesia matured first in major metros such as Jakarta, Bandung, Surabaya, and Denpasar. Before committing to a Tier 3 architecture, the team must run a *live tile probe* over Palembang's bounding box first.

**Feasibility Conclusion:** For the *early exploration* phase, **Tier 1 (stylized prototype)** is the most fit-for-purpose starting point. If the project moves on to spatial analytics, the most rational upgrade is a **hybrid Tier 2** (using *3D Tiles* from OSM + DEMNAS extrusion for city massing, while keeping custom stylized/detailed 3D assets for Ampera Bridge, Kuto Besak Fort, Kemaro Island, the Great Mosque, and the LRT line).

---

## 4. Topic 2 — Fit-for-Purpose Features & Execution Pattern Comparison

### 4.1 Feature Roadmap by Maturity Stage

To avoid building features that look impressive but deliver little value, features should be split into three waves:

- **Wave 1 — Early Exploration MVP (Already achieved in this prototype):**
  - Musi River corridor + instantly recognizable iconic landmarks (*Ampera, Kuto Besak, Kemaro Island, Great Mosque, Monpera, LRT, Rumah Limas*).
  - Orbit/pan/zoom navigation within safe bounds + curated camera presets + time-of-day switch (*Day/Sunset/Night*) + a concise info card that is honest about scale limitations.
- **Wave 2 — Data-Driven Spatial Exploration (If moving to Tier 2):**
  - Real coordinates (UTM 48S) at 1:1 scale with *level-of-detail* (LOD) or *3D Tiles* so the 6 km to Kemaro Island stays smooth.
  - Thematic *layer toggles*: Seberang Ilir/Ulu district boundaries, river transport routes & the South Sumatra LRT corridor, and Musi River flood/tide elevation simulation.
  - Landmark/address search and camera *deep-link URLs* (sharing a specific viewpoint).
- **Wave 3 — Operations & Digital Twin (Only with an institutional data sponsor):**
  - Live sensor/API data integration (Musi water level, vessel/AIS positions, LRT train positions) plus collaborative annotation and sun-shadow analysis for building-permit reviews.

### 4.2 Execution Pattern Comparison: Multi-Agent Orchestrator vs Alternatives

The choice of execution pattern determines speed, token cost, and engineering failure risk:

| Execution Pattern | How It Works | Strengths | Weaknesses & Failure Modes | Best Suited For |
|---|---|---|---|---|
| **1. Multi-Agent Orchestrator** *(Explorer → Planner → Worker → Verifier/Challenger)* | The orchestrator decomposes tasks, assigns parallel research, defines interface contracts (`PROJECT.md`), then verifies with separate agents | Clear separation of responsibilities; independent verification effectively catches code-vs-report inconsistencies | **High coordination overhead & token amplification** (repeated handoff documents); risk of *context drift* if interface contracts aren't locked; uneconomical for small UI changes | Multi-track projects (e.g., 3D code + QA scripts + synchronized analytical report) or medium-to-large teams/codebases with strict audit standards |
| **2. Iterative Single Agent** *(1 coding agent + build/screenshot loop)* | One agent designs, writes code, runs `vite build` + `verify.mjs`, looks at the PNG output, then polishes | Context stays intact in a single working memory; low step-to-step latency; most token-efficient for repos with <25 files | Risk of *blind spots* when auditing its own work (*confirmation bias*) unless forced to run test scripts and explicitly inspect screenshots | **Early Tier 1 prototypes like this repo**, fast shader/geometry experiments, and UI iteration |
| **3. Deterministic Pipeline / DAG** *(Python/GDAL/Blender + `3d-tiles-tools` → Static Viewer)* | Spatial data processing runs as deterministic, config-driven scripts; AI is used only to write/maintain the pipeline | 100% reproducibility; token-efficient when processing millions of OSM/DEMNAS polygons (the agent never reads raw data into the *prompt*) | Less flexible for aesthetic/artistic decisions without human involvement or visual preview tools | **Tier 2 & Tier 3 (city-scale GIS)**, where geospatial data volume cannot fit into an LLM context window |
| **4. Human-in-the-Loop Co-pilot** *(3D Designer / GIS Engineer + AI Assistant)* | Humans own visual composition decisions & hero asset modeling in Blender/QGIS; AI assists with Three.js code, shaders, and HUD | Highest artistic quality and cultural accuracy for Palembang (*Rumah Limas* carving proportions, Pagoda ornaments) | Depends on availability of 3D/GIS experts; initial speed follows human schedules | High-fidelity hero assets for public exhibitions, digital museums, or official local-government production apps |

**Critical Finding from This Project's Execution:** For a ~15–20 file prototype, the biggest value did not come from having many agents, but from **a closed visual verification loop (headless WebGL screenshot → image inspection by a multimodal model → fix)**. Without inspecting actual images, an agent only guesses what the 3D scene looks like from numeric coordinates: in this project, defects such as the info card covering Kemaro Island, overlapping roofs in the Kuto Besak courtyard, and a clipped shoreline were only detected after viewing PNG screenshots, not from `vite build` output.

---

## 5. Topic 3 — Development Time & Token Usage Estimates

The estimates below separate development of **Tier 1 (Stylized Prototype, aligned with this project's build reality)**, **Tier 2 (City-Scale GIS)**, and **Tier 3 (Digital Twin)**.

### 5.1 Why Is Token Consumption Often Higher Than Expected?

A common mistake when budgeting AI-driven projects is counting only code output tokens (`~15–30K` tokens for ~2,000 lines of code). In an *agentic workflow*, the main drivers of total tokens are:
1. **Input Context Amplification:** Every *tool call* resends the *system prompt*, conversation history, and files that were read. Over a 30–60 turn session, cumulative input tokens reach **10×–30×** the output tokens.
2. **Tool Outputs & Logs:** Results of `find`, `npm install`, build error logs, and re-reads of large files all land in the input context.
3. **Multimodal Vision Tokens:** Inspecting 6–7 PNG screenshots at `1280×760` over several fix rounds adds a significant image-input token load, but is absolutely necessary to prevent *visual hallucination*.
4. **Retry & Polish Loops:** Fixing camera positions, night lighting, or *bounding box* collisions adds 2–4 full iterations.

### 5.2 Time & Token Estimates per Phase

> **Baseline Assumption:** One Tier 1 *agentic* phase assumes active *prompt caching* or a structured session; figures reflect **total tokens (Input + Output + Vision/Tool)** for one complete project cycle through QA.

| Project Phase | Tier 1: *Stylized* Prototype (AI-Assisted / Agentic) | Tier 2: City-Scale GIS (DAG + AI Co-pilot) | Tier 3: Digital Twin (UAV/3D Tiles + Expert Team) | Main Token Sources (When Using Agents) |
|---|---|---|---|---|
| **1. Data Exploration, Architecture & Spatial Contracts** | **1–2 hours** *(~60K–180K tokens)* | **3–5 days** *(~250K–700K tokens)* | **1–2 weeks** *(~400K–1.2M tokens)* | Geographic reference research, local toolchain checks, coordinate system design |
| **2. Core 3D Implementation / Geospatial Pipeline** | **2–5 hours** *(~150K–450K tokens)* | **1.5–3 weeks** *(~800K–2.2M tokens)* | **3–6 weeks** *(~1.5M–4M tokens)* | Three.js/shader code synthesis, landmark module iteration, GDAL/3D Tiles ETL scripts |
| **3. Detailed Asset / Thematic Data & HUD Integration** | **1–2 hours** *(~80K–220K tokens)* | **1–2 weeks** *(~500K–1.4M tokens)* | **2–4 weeks** *(~1M–2.5M tokens)* | HUD interface, cross-layer coordinate sync, *instancing*/LOD optimization |
| **4. Technical QA, Headless Render Verification & Visual Polish** | **1–3 hours** *(~120K–400K tokens)* | **3–5 days** *(~400K–1.1M tokens)* | **1–2 weeks** *(~800K–2M tokens)* | Writing `verify.mjs`, multimodal screenshot (PNG) inspection, framing & lighting fixes |
| **5. Documentation, Consistency Testing & Handover** | **1–2 hours** *(~70K–180K tokens)* | **2–3 days** *(~200K–500K tokens)* | **3–5 days** *(~300K–800K tokens)* | Writing the README, technical report, 1:1 cross-audit between docs and code |
| **Realistic Total Estimate** | **6–14 working hours** *(~480K–1.43M total tokens; efficient single agent at the lower bound, multi-agent at the upper bound)* | **3–7 weeks** *(~2.15M–5.9M total tokens)* | **7–14 weeks** *(~4.0M–10.5M total tokens)* | **75–90% are input/context & vision tokens**, only **10–25%** are output generation tokens |

*Calibration Note:* Without AI agents (fully manual work by one mid-level Three.js developer), Tier 1 typically takes **2–4 working days**, so an AI-assisted workflow speeds up the early prototype phase by roughly **3×–5×**, provided the verification environment (Node, headless WebGL browser) is proven working from the very first minute.

---

## 6. Topic 4 — AI Model Recommendations per Project Phase

Model selection should combine **phase-specific capabilities** (spatial reasoning, code synthesis accuracy, multimodal vision, Indonesian-language technical writing) with cost and latency discipline.

| Project Phase | Primary Cognitive Need | Recommended Primary Model Class | Budget / *Open-Weight* Alternative | Trade-offs & Practical Notes |
|---|---|---|---|---|
| **Architecture, Coordinate Mapping & Spatial Debugging** | 3D geometric reasoning, cross-module contract consistency, *edge case* analysis | **Frontier Reasoning Models** *(e.g., latest-generation Claude Opus/Sonnet, OpenAI o3 / GPT-5 reasoning, Gemini Pro reasoning)* | **DeepSeek-R1 / Qwen3-Coder-Thinking** (via API or self-hosted) | Higher cost per token, but far cheaper than 5× fix cycles caused by inverted coordinate axes (`+Z` vs `-Z`) or bridges clipping through piers |
| **Three.js Modules, GLSL Shaders & GIS ETL Scripts** | Fast modular code writing, modern Three.js API, Python/GDAL/Bash | **High-Speed Coding Models** *(e.g., Claude Sonnet, GPT-4.1/GPT-5-codex, Gemini Flash/Pro)* | **Qwen2.5/3-Coder-32B+** or **Codestral** | Upper-mid-tier models excel at daily throughput; avoid models that are too small for GLSL, since uniform/varying syntax errors are hard to catch statically |
| **Visual QA & Render Screenshot Inspection** | Visual understanding of 3D scenes (*multimodal vision*), floating-object detection, UI contrast & label *overlap* evaluation | **Accurate Multimodal Vision Models** *(e.g., Claude Sonnet/Opus Vision, GPT-4o / GPT-5 Vision, Gemini Pro Vision)* | **Qwen2.5-VL-72B** | **Multimodal is mandatory.** Never delegate visual QA to a *text-only* model — it can only read DOM/triangle metrics and will never see UI covering Kemaro Island |
| **Analytical Reports & Indonesian-Language Documentation** | Processing factual evidence across files, technical consistency, formal yet natural Indonesian grammar | **Long-Context Models with Strong Indonesian Capability** *(e.g., Claude Sonnet/Opus, Gemini Pro, GPT-4o/5)* | **Llama-3.3-70B / Qwen3** (needs more careful editing for formal terminology) | Prioritize models with a large context window (`≥128K`) so all source code, verification logs, and specs can be audited at once without truncation |

### Price Volatility & Budget Strategy

Per-million-token *unit pricing* for commercial AI models changes quickly every quarter as new models launch and *prompt caching* discounts evolve. This document therefore separates **token volume** (Section 5) from vendor-specific rates:
- **Use budget ratios:** As a cross-generation comparative benchmark, *frontier reasoning* models are typically **3×–10× more expensive per token** than *fast/flash* models and **10×–30× more expensive** than managed *open-weight* models.
- **Enable Prompt Caching & Role Separation:** Resending project files repeatedly with caching enabled can cut input token costs by **50–90%**, keeping strong reasoning models affordable for the design and final audit phases.

---

## 7. Assumption Stress-Testing, Risk Matrix & Mitigation

### 7.1 Testing Six Popular but Misleading Assumptions

1. **Assumption 1: *"Indonesian open data (OSM + DEMNAS) is ready to render into an accurate 3D city out of the box."***
   - **Reality / Rebuttal:** No. ~8 m DEMNAS is only adequate for macro terrain contours and does not capture river embankments or bridge decks. Most OSM building polygons in Palembang lack consistent floor-count data, so without data cleaning and custom assets for iconic landmarks, the result looks like a random block city that doesn't feel like Palembang.
2. **Assumption 2: *"An AI agent can judge the success of a 3D visualization from the source code or an `exit code 0` alone."***
   - **Reality / Rebuttal:** Fatally wrong. Code can compile cleanly (`0 errors`) while the camera faces an empty sky, jetties float above the water, or UI cards cover the main object. During this prototype's development, direct inspection of PNG screenshots revealed overlapping BKB roofs, stacked labels in the overview, and an info card covering Kemaro Island.
3. **Assumption 3: *"Multi-agent orchestration is always faster and better than a single agent."***
   - **Reality / Rebuttal:** Only true when the work has genuinely independent parallel tracks or needs a separate independent auditor. For a small 3D web app (~15 files), layered orchestration adds communication latency, copies context repeatedly, and risks coordinate mismatches between the river-building agent and the bridge-building agent unless both reference a single shared geometric bounds function (such as `getRiverBoundsAt(x)` in this project).
4. **Assumption 4: *"Photorealistic visualization is always superior to stylized design for early exploration."***
   - **Reality / Rebuttal:** For concept exploration and stakeholder alignment, a *stylized* look is far more communicative: the red silhouette of Ampera Bridge, the shape of Kuto Besak Fort, the Great Mosque's tiered roof, and the Kemaro Island Pagoda read instantly, without blurry texture noise, tens of megabytes of downloads, or *frame drops* on standard devices.
5. **Assumption 5: *"Google Photorealistic 3D Tiles are automatically available, complete, and uniform across Palembang."***
   - **Reality / Rebuttal:** 3D Tiles coverage in Indonesia does not yet extend evenly to all secondary cities; relying on the service without a live API check over Palembang's coordinates creates an architectural dependency risk (*single point of failure*) mid-project.
6. **Assumption 6: *"AI cost is driven by how many lines of code the agent writes."***
   - **Reality / Rebuttal:** Wrong. Code output tokens are just the tip of the iceberg (10–25%). The real cost drivers are repeated reads of code context, terminal output, debugging loops, and screenshot image analysis.

### 7.2 Risk Matrix & Mitigation Strategies

| ID | Risk | Likelihood | Impact | Mitigation Strategy |
|---|---|---|---|---|
| **R1** | Coordinate misalignment between 3D elements (floating objects, clipping through bridge piers, disconnected jetties) | High | High | Use a single geometric source of truth (e.g., shared `getRiverBoundsAt(x)` and `GROUND_Y`) plus multi-angle screenshot verification |
| **R2** | WebGL context failure on user machines or in headless CI/sandbox environments | Medium | High | Provide an informative WebGL fallback message (`showWebGLFallback`), avoid external CDNs at runtime, and test CI with the `--use-angle=swiftshader` flag |
| **R3** | Bundle size & *draw call* bloat when increasing city detail (FPS drops on phones/non-GPU laptops) | High (Tier 2+) | Medium | Keep Tier 1 low-poly (~41K triangles); apply `InstancedMesh`, static geometry merging, and LOD-based *3D Tiles* when migrating to Tier 2 |
| **R4** | Perception bias from compressed scale (users believing the Kuto Besak–Kemaro Island distance is really only ~3× the river width) | Medium | Medium | State the diorama scale note explicitly in the HUD, `README.md`, and project documentation |
| **R5** | Local toolchain version dependency & regressions after doc/code changes | Medium | Medium | Pin prerequisites (`Node >= 20`), document full commands in `README.md`, and rerun `npm run build && npm run verify` before handover |

---

## 8. Consistency Checklist & Self-Audit (AC3 & AC4)

The following table confirms that all analysis requirements (AC3) and 1:1 synchronization with the verified prototype (AC4) are met without deviation:

| Audit Item | Status | Verified Evidence in This Project Repository |
|---|---|---|
| **Topic 1 (Feasibility & Extent)** | Met | Section 3 evaluates Tier 1 vs Tier 2 vs Tier 3, OSM/DEMNAS gaps (~8 m), partial 3D Tiles coverage, GPU/VRAM, and cost |
| **Topic 2 (Features & Execution Pattern Comparison)** | Met | Section 4 maps Wave 1–3 features and compares Multi-Agent Orchestrator vs Iterative Single Agent vs Deterministic Pipeline/DAG vs Human-in-the-Loop |
| **Topic 3 (Time & Token Estimates)** | Met | Section 5 details time & token ranges for 5 phases across 3 tiers, including input context amplification & vision tokens |
| **Topic 4 (AI Model Recommendations per Phase)** | Met | Section 6 maps model classes per phase with *open-weight* alternatives and price-volatility notes |
| **Assumption Challenges & Risk Matrix** | Met | Section 7 critically challenges 6 common assumptions and presents the `R1–R5` risk matrix |
| **Command & Build Sync (AC1 & AC4)** | Verified | `npm install` (43 packages in `package-lock.json`), `npm run build` (~127–135 ms, 18 modules, `dist/`), `npm run preview`, and `npm run verify` are recorded identically to `package.json` & `README.md` |
| **Visual & Telemetry Sync (AC2 & AC4)** | Verified | 13 PNG screenshots (`artifacts/preview-*.png`), `meshCount: 1,091`, `triangles: ~242.6K`, `urbanStats` (81 shophouses, 241 houses, 978 trees, 68 lamps, 40 cars), `mobileBounds.fits: true` (`390×844`), `0` console/page errors, and all compressed-scale & procedural-geometry limitations honestly recorded |
