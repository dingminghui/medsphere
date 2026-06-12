import graphJson from "@/assets/1.json";
import type { GraphData, GraphPayload } from "@/types/graph";
import type { GraphProject } from "@/types/project";

const STORAGE_KEY = "medsphere:graph-projects";
const DEFAULT_PROJECT_ID = "default-dapagliflozin";

export type ValidateGraphResult =
  | { ok: true; graph: GraphData }
  | { ok: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function validateGraphData(data: unknown): GraphData {
  if (!isRecord(data)) {
    throw new Error("图谱数据须为对象");
  }

  const { nodes, edges } = data;
  if (!Array.isArray(nodes) || !Array.isArray(edges)) {
    throw new Error("须包含 nodes 与 edges 数组");
  }

  for (const node of nodes) {
    if (!isRecord(node) || typeof node.id !== "string" || !Array.isArray(node.labels)) {
      throw new Error("nodes 中每项须包含 id 与 labels");
    }
  }

  for (const edge of edges) {
    if (!isRecord(edge) || typeof edge.id !== "string") {
      throw new Error("edges 中每项须包含 id");
    }
    if (typeof edge.source !== "string" || typeof edge.target !== "string") {
      throw new Error("edges 中每项须包含 source 与 target");
    }
  }

  return { nodes, edges } as GraphData;
}

export function normalizeGraphPayload(input: unknown): GraphData {
  if (Array.isArray(input)) {
    const first = input[0];
    if (isRecord(first) && "graph" in first) {
      return validateGraphData(first.graph);
    }
    throw new Error("数组格式须为 [{ graph: { nodes, edges } }]");
  }

  if (!isRecord(input)) {
    throw new Error("根节点须为对象或数组");
  }

  if ("graph" in input) {
    return validateGraphData(input.graph);
  }

  if ("nodes" in input && "edges" in input) {
    return validateGraphData(input);
  }

  throw new Error("须为 { graph: ... } 或 { nodes, edges } 格式");
}

export function validateGraphJson(raw: string): ValidateGraphResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, error: "请输入 JSON 内容" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return { ok: false, error: "JSON 格式不正确，请检查括号与引号" };
  }

  try {
    const graph = normalizeGraphPayload(parsed);
    return { ok: true, graph };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "数据结构不符合要求",
    };
  }
}

function readProjects(): GraphProject[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((item): item is GraphProject => {
      return (
        isRecord(item) &&
        typeof item.id === "string" &&
        typeof item.title === "string" &&
        isRecord(item.graph) &&
        typeof item.createdAt === "number"
      );
    });
  } catch {
    return [];
  }
}

function writeProjects(projects: GraphProject[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function getAllProjects(): GraphProject[] {
  return readProjects().sort((left, right) => right.createdAt - left.createdAt);
}

export function getProject(id: string): GraphProject | undefined {
  return readProjects().find((project) => project.id === id);
}

export function createProject(title: string, graph: GraphData): GraphProject {
  const now = Date.now();
  const trimmedTitle = title.trim();

  const project: GraphProject = {
    id: crypto.randomUUID(),
    title: trimmedTitle,
    graph,
    nodeCount: graph.nodes.length,
    edgeCount: graph.edges.length,
    createdAt: now,
    updatedAt: now,
  };

  const projects = readProjects();
  projects.push(project);
  writeProjects(projects);

  return project;
}

export function ensureDefaultProject(): void {
  const projects = readProjects();
  if (projects.some((project) => project.id === DEFAULT_PROJECT_ID)) {
    return;
  }

  const payload = graphJson as GraphPayload[];
  const graph = payload[0]?.graph ?? { nodes: [], edges: [] };
  const now = Date.now();

  projects.push({
    id: DEFAULT_PROJECT_ID,
    title: "达格列净知识图谱",
    graph,
    nodeCount: graph.nodes.length,
    edgeCount: graph.edges.length,
    createdAt: now,
    updatedAt: now,
  });

  writeProjects(projects);
}

export function formatProjectDate(timestamp: number): string {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}
