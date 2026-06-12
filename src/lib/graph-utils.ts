import type { GraphData, GraphEdge, GraphNode } from "@/types/graph";

export interface NodePastelStyle {
  inner: string;
  outer: string;
  text: string;
  glow: string;
}

const LABEL_PASTELS: Record<string, NodePastelStyle> = {
  Drug: { inner: "#b8d4f8", outer: "#e8f2fc", text: "#3d5068", glow: "#9ec5f0" },
  Disease: { inner: "#f8c8d8", outer: "#fdeef3", text: "#6b4455", glow: "#f0a8c0" },
  KnowledgeCard: { inner: "#c8d8f8", outer: "#eef3fc", text: "#445568", glow: "#a8c0e8" },
  Guideline: { inner: "#b8e8d0", outer: "#e8f8ef", text: "#3d5a48", glow: "#98d8b8" },
  ClinicalTrial: { inner: "#f8e0b0", outer: "#fdf6e8", text: "#6b5530", glow: "#f0d090" },
  EpidemiologyData: { inner: "#f8d0b8", outer: "#fdf0e8", text: "#6b4a38", glow: "#f0b898" },
  AdverseReaction: { inner: "#f8c0d8", outer: "#fdeef5", text: "#6b3d55", glow: "#f0a0c0" },
  PharmacologicalMechanism: { inner: "#b8e8e0", outer: "#e8f8f5", text: "#3d5855", glow: "#98d8d0" },
  Biomarker: { inner: "#d8e8b8", outer: "#f3f8e8", text: "#4a5538", glow: "#c0d898" },
  Company: { inner: "#d8c8f8", outer: "#f0ecfc", text: "#4a4068", glow: "#c0a8e8" },
  DrugClass: { inner: "#c8c8f8", outer: "#ededfc", text: "#454568", glow: "#a8a8e8" },
  KnowledgeDomain: { inner: "#b8d8f0", outer: "#e8f2fa", text: "#3d5060", glow: "#98c0e0" },
  KeyMessage: { inner: "#e8c8f0", outer: "#f5ecfa", text: "#554060", glow: "#d0a0e0" },
  SourceMaterial: { inner: "#d8dce8", outer: "#f0f2f8", text: "#4a5060", glow: "#c0c8d8" },
  ClinicalOutcome: { inner: "#b8e8c8", outer: "#e8f8ec", text: "#3d5848", glow: "#98d8a8" },
  PatientPopulation: { inner: "#f0e0b8", outer: "#faf6e8", text: "#5a5038", glow: "#e0d098" },
  DosageRegimen: { inner: "#b8e0f0", outer: "#e8f4fa", text: "#3d5560", glow: "#98c8e0" },
  ApprovalMilestone: { inner: "#f8c0c8", outer: "#fdeef0", text: "#6b4048", glow: "#f0a0a8" },
  ComplianceRequirement: { inner: "#c0e8c8", outer: "#ecf8ee", text: "#3d5540", glow: "#a0d8a8" },
  PricingMilestone: { inner: "#f0d0b0", outer: "#faf0e8", text: "#5a4838", glow: "#e0b890" },
  MarketData: { inner: "#d0e8b0", outer: "#f2f8e8", text: "#4a5538", glow: "#b8d890" },
  RegulatoryAgency: { inner: "#b8c8f0", outer: "#e8eefc", text: "#3d4868", glow: "#98b0e0" },
  CombinationTherapy: { inner: "#d8b8f0", outer: "#f0e8fc", text: "#4a3868", glow: "#c098e0" },
  InsurancePolicy: { inner: "#b8e8e0", outer: "#e8f8f5", text: "#3d5550", glow: "#98d8d0" },
  GuidelineComparison: { inner: "#f0b8b8", outer: "#fceeee", text: "#5a3838", glow: "#e09898" },
  CategoryHub: { inner: "#d0d8e8", outer: "#f0f4fa", text: "#4a5568", glow: "#b0c0d8" },
};

const LABEL_COLORS: Record<string, string> = Object.fromEntries(
  Object.entries(LABEL_PASTELS).map(([key, style]) => [key, style.glow]),
);

const LABEL_NAMES_CN: Record<string, string> = {
  Drug: "药物",
  Disease: "疾病",
  KnowledgeCard: "知识卡片",
  Guideline: "指南",
  ClinicalTrial: "临床试验",
  EpidemiologyData: "流行病学",
  AdverseReaction: "不良反应",
  PharmacologicalMechanism: "药理机制",
  Biomarker: "生物标志物",
  Company: "企业",
  DrugClass: "药物类别",
  KnowledgeDomain: "知识领域",
  KeyMessage: "关键信息",
  SourceMaterial: "来源资料",
  ClinicalOutcome: "临床结局",
  PatientPopulation: "患者人群",
  DosageRegimen: "给药方案",
  ApprovalMilestone: "获批里程碑",
  ComplianceRequirement: "合规要求",
  PricingMilestone: "定价里程碑",
  MarketData: "市场数据",
  RegulatoryAgency: "监管机构",
  CombinationTherapy: "联合治疗",
  InsurancePolicy: "医保政策",
  GuidelineComparison: "指南对比",
  CategoryHub: "分类",
};

export interface GraphLegendItem {
  label: string;
  nameCn: string;
  count: number;
}

export interface RelatedNode {
  node: GraphNode;
  edgeType: string;
}

export function getLabelNameCn(label: string): string {
  return LABEL_NAMES_CN[label] ?? label;
}

export function getGraphLegendItems(data: GraphData): GraphLegendItem[] {
  const counts = new Map<string, number>();

  for (const node of data.nodes) {
    if (isCategoryHub(node)) {
      continue;
    }
    const label = getNodeLabel(node);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([label, count]) => ({
      label,
      nameCn: getLabelNameCn(label),
      count,
    }));
}

export interface ClusterPosition {
  x: number;
  y: number;
}

export interface InitialVisibleState {
  visibleIds: Set<string>;
  depthMap: Map<string, number>;
  rootId: string;
  hubNodes: GraphNode[];
  clusterCenters: Map<string, ClusterPosition>;
  rootCenter: ClusterPosition;
}

export function isCategoryHub(node: GraphNode): boolean {
  return node.labels.includes("CategoryHub") || node.properties.isHub === true;
}

export function getHubMemberIds(node: GraphNode): string[] {
  const members = node.properties.memberIds;
  return Array.isArray(members) ? members.filter((id): id is string => typeof id === "string") : [];
}

export function getCategoryHubId(rootId: string, label: string): string {
  return `hub:${rootId}:${label}`;
}

export function getNodeLabel(node: GraphNode): string {
  if (isCategoryHub(node)) {
    const category = node.properties.categoryLabel;
    return typeof category === "string" ? category : "CategoryHub";
  }
  return node.labels[0] ?? "Unknown";
}

export function getNodeColor(node: GraphNode): string {
  const label = getNodeLabel(node);
  return LABEL_COLORS[label] ?? "#98a8c0";
}

export function getNodePastelStyle(node: GraphNode): NodePastelStyle {
  const label = getNodeLabel(node);
  return (
    LABEL_PASTELS[label] ?? {
      inner: "#d8dce8",
      outer: "#f0f2f8",
      text: "#4a5568",
      glow: "#b0b8c8",
    }
  );
}

export interface NodeLabelLayout {
  lines: string[];
  fontSize: number;
  radius: number;
  fullText: string;
  isTruncated: boolean;
}

function wrapLabelLines(
  text: string,
  maxChars: number,
  maxLines: number,
): { lines: string[]; truncated: boolean } {
  if (text.length <= maxChars) {
    return { lines: [text], truncated: false };
  }

  const lines: string[] = [];
  let index = 0;

  while (index < text.length && lines.length < maxLines) {
    lines.push(text.slice(index, index + maxChars));
    index += maxChars;
  }

  const truncated = lines.join("").length < text.length;
  if (truncated && lines.length > 0) {
    const lastIndex = lines.length - 1;
    const lastLine = lines[lastIndex] ?? "";
    lines[lastIndex] = `${lastLine.slice(0, Math.max(1, maxChars - 1))}…`;
  }

  return { lines, truncated };
}

const labelLayoutCache = new WeakMap<GraphNode, NodeLabelLayout>();

export function computeNodeLabelLayout(node: GraphNode): NodeLabelLayout {
  const cached = labelLayoutCache.get(node);
  if (cached) {
    return cached;
  }

  const innerText = getNodeInnerLabel(node);
  const fullText = getNodeTooltipText(node);
  const hub = isCategoryHub(node);
  const minRadius = hub ? 48 : 36;
  const maxRadius = hub ? 66 : 60;
  const maxLines = hub ? 2 : 3;
  const minFontSize = 9;
  const maxFontSize = hub ? 12 : 11;

  let fallback: NodeLabelLayout | null = null;

  for (let fontSize = maxFontSize; fontSize >= minFontSize; fontSize -= 1) {
    for (let radius = minRadius; radius <= maxRadius; radius += 2) {
      const innerWidth = radius * 1.42;
      const innerHeight = radius * 1.42;
      const maxChars = Math.max(3, Math.floor(innerWidth / (fontSize * 0.9)));
      const { lines, truncated } = wrapLabelLines(innerText, maxChars, maxLines);
      const lineHeight = fontSize * 1.32;
      const textHeight = lines.length * lineHeight;
      const maxLineWidth = Math.max(...lines.map((line) => line.length * fontSize * 0.9), 0);
      const fits =
        textHeight <= innerHeight &&
        maxLineWidth <= innerWidth &&
        radius >= Math.max(textHeight / 2, maxLineWidth / 2) + 6;

      const layout: NodeLabelLayout = {
        lines,
        fontSize,
        radius,
        fullText,
        isTruncated: truncated,
      };

      if (fits) {
        labelLayoutCache.set(node, layout);
        return layout;
      }

      fallback = layout;
    }
  }

  const resolved =
    fallback ?? {
      lines: [`${innerText.slice(0, 5)}…`],
      fontSize: minFontSize,
      radius: minRadius,
      fullText,
      isTruncated: true,
    };
  labelLayoutCache.set(node, resolved);
  return resolved;
}

export function getNodeRadius(node: GraphNode): number {
  return computeNodeLabelLayout(node).radius;
}

export function getNodeLabelFontSize(node: GraphNode): number {
  return computeNodeLabelLayout(node).fontSize;
}

export function createBlobPath(cx: number, cy: number, radius: number, seed: number): string {
  const points = 7;
  const coords: [number, number][] = [];

  for (let index = 0; index < points; index += 1) {
    const angle = (2 * Math.PI * index) / points - Math.PI / 2;
    const variance = 0.82 + Math.sin(seed + index * 2.1) * 0.14;
    coords.push([cx + Math.cos(angle) * radius * variance, cy + Math.sin(angle) * radius * variance]);
  }

  const [firstX, firstY] = coords[0] ?? [cx, cy];
  let path = `M ${firstX} ${firstY}`;

  for (let index = 0; index < points; index += 1) {
    const current = coords[index];
    const next = coords[(index + 1) % points];
    const previous = coords[(index - 1 + points) % points];
    if (!current || !next || !previous) {
      continue;
    }
    const cpX = current[0] + (next[0] - previous[0]) * 0.18;
    const cpY = current[1] + (next[1] - previous[1]) * 0.18;
    path += ` Q ${cpX} ${cpY} ${next[0]} ${next[1]}`;
  }

  return `${path} Z`;
}

export function truncateLabel(text: string, maxLength = 16): string {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength)}…`;
}

export function getNodeInnerLabel(node: GraphNode): string {
  if (isCategoryHub(node)) {
    const name = node.properties.name;
    return typeof name === "string" ? name : "分类";
  }

  return getNodeDisplayName(node);
}

export interface NodeTooltipContent {
  title: string;
  lines: string[];
}

function truncateTooltipText(text: string, maxLength = 64): string {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength)}…`;
}

function pushUniqueLine(lines: string[], line: string | undefined, title: string): void {
  if (!line) {
    return;
  }
  const trimmed = line.trim();
  if (!trimmed || trimmed === title || lines.includes(trimmed)) {
    return;
  }
  lines.push(trimmed);
}

export function getNodeTooltipContent(node: GraphNode): NodeTooltipContent {
  if (isCategoryHub(node)) {
    const title = getNodeInnerLabel(node);
    const count = node.properties.memberCount;
    const lines: string[] = [];

    if (typeof count === "number") {
      lines.push(`包含 ${count} 个成员节点`);
    }

    return { title, lines };
  }

  const title = getNodeDisplayName(node);
  const label = getNodeLabel(node);
  const nameCn = getLabelNameCn(label);
  const { properties } = node;
  const lines: string[] = [];

  pushUniqueLine(lines, `类型：${nameCn}`, title);

  const drugClass = typeof properties.drugClass === "string" ? properties.drugClass : undefined;
  const genericNameEn =
    typeof properties.genericNameEn === "string" ? properties.genericNameEn : undefined;
  const description =
    typeof properties.description === "string" ? properties.description : undefined;

  pushUniqueLine(lines, drugClass, title);
  pushUniqueLine(lines, genericNameEn, title);
  pushUniqueLine(lines, description ? truncateTooltipText(description) : undefined, title);

  return { title, lines: lines.slice(0, 3) };
}

export function getNodeTooltipText(node: GraphNode): string {
  const { title, lines } = getNodeTooltipContent(node);
  return [title, ...lines].join("\n");
}

export function getNodeDisplayName(node: GraphNode): string {
  if (isCategoryHub(node)) {
    return getNodeInnerLabel(node);
  }

  const { properties } = node;
  const candidates = [
    properties.name,
    properties.title,
    properties.genericName,
    properties.brandNameCn,
    properties.nodeId,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.length > 0) {
      return candidate;
    }
  }

  return node.id;
}

export function getNodeClusterKey(node: GraphNode, clusterOfNode: Map<string, string>): string {
  if (isCategoryHub(node)) {
    return node.id;
  }
  return clusterOfNode.get(node.id) ?? getNodeLabel(node);
}

export function getClusterPositions(
  count: number,
  width: number,
  height: number,
): ClusterPosition[] {
  if (count === 0) {
    return [];
  }

  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  const padX = Math.max(140, width * 0.08);
  const padY = Math.max(120, height * 0.1);
  const cellW = (width - padX * 2) / cols;
  const cellH = (height - padY * 2) / rows;

  return Array.from({ length: count }, (_, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const jitterX = ((index % 3) - 1) * 18;
    const jitterY = ((index % 5) - 2) * 12;

    return {
      x: padX + col * cellW + cellW / 2 + jitterX,
      y: padY + row * cellH + cellH / 2 + jitterY,
    };
  });
}

export function getRootNodeId(data: GraphData): string {
  const primary = data.nodes.find(
    (node) =>
      node.labels.includes("Drug") &&
      (node.properties.name === "达格列净" || node.properties.genericName === "达格列净"),
  );

  if (primary) {
    return primary.id;
  }

  const firstDrug = data.nodes.find((node) => node.labels.includes("Drug"));
  if (firstDrug) {
    return firstDrug.id;
  }

  return data.nodes[0]?.id ?? "";
}

export function buildCategoryHubs(
  rootId: string,
  data: GraphData,
  nodeById: Map<string, GraphNode>,
): GraphNode[] {
  const byLabel = new Map<string, string[]>();

  for (const neighborId of getNeighborIds(rootId, data.edges)) {
    const node = nodeById.get(neighborId);
    if (!node) {
      continue;
    }

    const label = node.labels[0] ?? "Unknown";
    const members = byLabel.get(label) ?? [];
    members.push(neighborId);
    byLabel.set(label, members);
  }

  return [...byLabel.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .map(([label, memberIds]) => ({
      id: getCategoryHubId(rootId, label),
      labels: ["CategoryHub"],
      properties: {
        isHub: true,
        categoryLabel: label,
        memberIds,
        memberCount: memberIds.length,
        anchorId: rootId,
        name: LABEL_NAMES_CN[label] ?? label,
      },
    }));
}

export function buildHubLinks(rootId: string, hubNodes: GraphNode[]): GraphEdge[] {
  return hubNodes.map((hub) => ({
    id: `synthetic:${rootId}:${hub.id}`,
    type: "CATEGORY",
    source: rootId,
    target: hub.id,
    properties: {},
  }));
}

export function getInitialVisibleState(
  data: GraphData,
  width = 1200,
  height = 800,
): InitialVisibleState {
  const rootId = getRootNodeId(data);
  const nodeById = new Map(data.nodes.map((node) => [node.id, node]));
  const hubNodes = buildCategoryHubs(rootId, data, nodeById);
  const positions = getClusterPositions(hubNodes.length, width, height);

  const visibleIds = new Set<string>();
  const depthMap = new Map<string, number>();
  const clusterCenters = new Map<string, ClusterPosition>();

  const rootCenter = { x: width / 2, y: height / 2 };
  visibleIds.add(rootId);
  depthMap.set(rootId, 0);
  clusterCenters.set(rootId, rootCenter);

  hubNodes.forEach((hub, index) => {
    visibleIds.add(hub.id);
    depthMap.set(hub.id, 0);
    const position = positions[index];
    if (position) {
      clusterCenters.set(hub.id, position);
    }
  });

  return { visibleIds, depthMap, rootId, hubNodes, clusterCenters, rootCenter };
}

export function getNeighborIds(nodeId: string, edges: GraphEdge[]): string[] {
  const neighbors: string[] = [];

  for (const edge of edges) {
    if (edge.source === nodeId) {
      neighbors.push(edge.target);
    } else if (edge.target === nodeId) {
      neighbors.push(edge.source);
    }
  }

  return neighbors;
}

export function getConnectedIds(
  nodeId: string,
  edges: GraphEdge[],
  nodeById: Map<string, GraphNode>,
): Set<string> {
  const node = nodeById.get(nodeId);
  if (node && isCategoryHub(node)) {
    const ids = new Set<string>([nodeId]);
    return ids;
  }

  const ids = new Set<string>([nodeId]);

  for (const edge of edges) {
    if (edge.source === nodeId) {
      ids.add(edge.target);
    } else if (edge.target === nodeId) {
      ids.add(edge.source);
    }
  }

  return ids;
}

export function getParentNodes(
  nodeId: string,
  edges: GraphEdge[],
  nodeById: Map<string, GraphNode>,
): RelatedNode[] {
  const parents: RelatedNode[] = [];

  for (const edge of edges) {
    if (edge.target !== nodeId) {
      continue;
    }

    const node = nodeById.get(edge.source);
    if (node) {
      parents.push({ node, edgeType: edge.type });
    }
  }

  return parents;
}

export function getChildNodes(
  nodeId: string,
  edges: GraphEdge[],
  nodeById: Map<string, GraphNode>,
): RelatedNode[] {
  const children: RelatedNode[] = [];

  for (const edge of edges) {
    if (edge.source !== nodeId) {
      continue;
    }

    const node = nodeById.get(edge.target);
    if (node) {
      children.push({ node, edgeType: edge.type });
    }
  }

  return children;
}

export function formatPropertyValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "—";
  }
  if (typeof value === "boolean") {
    return value ? "是" : "否";
  }
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).join("、");
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
}
