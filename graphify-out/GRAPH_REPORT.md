# Graph Report - RTR  (2026-06-03)

## Corpus Check
- 15 files · ~7,090 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 24 nodes · 13 edges · 4 communities detected
- Extraction: 69% EXTRACTED · 31% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]

## God Nodes (most connected - your core abstractions)
1. `useData()` - 5 edges
2. `Community()` - 2 edges
3. `Home()` - 2 edges
4. `Players()` - 2 edges
5. `Teams()` - 2 edges

## Surprising Connections (you probably didn't know these)
- `Community()` --calls--> `useData()`  [INFERRED]
  src\pages\Community.jsx → src\hooks\useData.js
- `Home()` --calls--> `useData()`  [INFERRED]
  src\pages\Home.jsx → src\hooks\useData.js
- `Teams()` --calls--> `useData()`  [INFERRED]
  src\pages\Teams.jsx → src\hooks\useData.js
- `Players()` --calls--> `useData()`  [INFERRED]
  src\pages\Players.jsx → src\hooks\useData.js

## Communities

### Community 0 - "Community 0"
Cohesion: 0.5
Nodes (2): useData(), Players()

### Community 5 - "Community 5"
Cohesion: 1.0
Nodes (1): Community()

### Community 6 - "Community 6"
Cohesion: 1.0
Nodes (1): Home()

### Community 7 - "Community 7"
Cohesion: 1.0
Nodes (1): Teams()

## Knowledge Gaps
- **Thin community `Community 0`** (4 nodes): `useData()`, `Players()`, `useData.js`, `Players.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 5`** (2 nodes): `Community()`, `Community.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 6`** (2 nodes): `Home()`, `Home.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 7`** (2 nodes): `Teams()`, `Teams.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useData()` connect `Community 0` to `Community 5`, `Community 6`, `Community 7`?**
  _High betweenness centrality (0.126) - this node is a cross-community bridge._
- **Why does `Community()` connect `Community 5` to `Community 0`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Why does `Home()` connect `Community 6` to `Community 0`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `useData()` (e.g. with `Community()` and `Home()`) actually correct?**
  _`useData()` has 4 INFERRED edges - model-reasoned connections that need verification._