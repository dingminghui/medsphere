import { ScrollArea } from "@/components/ui/ScrollArea";
import {
  formatPropertyValue,
  getChildNodes,
  getNodeColor,
  getNodeDisplayName,
  getNodeLabel,
  getParentNodes,
} from "@/lib/graph-utils";
import type { GraphData, GraphNode } from "@/types/graph";

interface NodeDetailPanelProps {
  node: GraphNode;
  data: GraphData;
  nodeById: Map<string, GraphNode>;
  onNodeSelect: (nodeId: string) => void;
  onClose: () => void;
}

const HIGHLIGHT_KEYS = new Set([
  "name",
  "title",
  "genericName",
  "genericNameEn",
  "brandNameCn",
  "nodeId",
  "description",
  "drugClass",
]);

const LABEL_NAMES_CN: Record<string, string> = {
  Drug: "药物",
  Disease: "疾病",
  KnowledgeCard: "知识卡片",
  Guideline: "指南",
  ClinicalTrial: "临床试验",
};

function getEnglishName(node: GraphNode): string | undefined {
  const candidates = [node.properties.genericNameEn, node.properties.brandNameEn];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.length > 0) {
      return candidate;
    }
  }
  return undefined;
}

export function NodeDetailPanel({
  node,
  data,
  nodeById,
  onNodeSelect,
  onClose,
}: NodeDetailPanelProps) {
  const parents = getParentNodes(node.id, data.edges, nodeById);
  const children = getChildNodes(node.id, data.edges, nodeById);
  const properties = Object.entries(node.properties).filter(
    ([key, value]) => !HIGHLIGHT_KEYS.has(key) && value !== null && value !== "",
  );

  const displayName = getNodeDisplayName(node);
  const englishName = getEnglishName(node);
  const label = getNodeLabel(node);
  const labelCn = LABEL_NAMES_CN[label] ?? label;
  const drugClass =
    typeof node.properties.drugClass === "string" ? node.properties.drugClass : undefined;

  return (
    <aside className="glass-card node-detail-panel">
      <div className="glass-card__glow glass-card__glow--pink" aria-hidden />
      <div className="glass-card__inner node-detail-panel__inner">
      <div className="node-detail-panel__header">
        <div className="node-detail-panel__title-row">
          <h2 className="node-detail-panel__title">
            {displayName}
            {englishName ? ` | ${englishName}` : ""}
          </h2>
          <button type="button" className="node-detail-panel__close" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </div>
        <div className="node-detail-panel__meta">
          <span
            className="node-detail-panel__meta-dot"
            style={{ backgroundColor: getNodeColor(node) }}
          />
          <span>
            {labelCn} ({label})
            {drugClass ? ` · ${drugClass}` : ""}
          </span>
        </div>
      </div>

      <div className="node-detail-panel__divider" />

      <ScrollArea className="node-detail-panel__scroll" type="always">
        <div className="node-detail-panel__body">
          {typeof node.properties.description === "string" && node.properties.description ? (
            <p className="node-detail-panel__description">{node.properties.description}</p>
          ) : null}

          {properties.length > 0 ? (
            <section className="node-detail-panel__section">
              <h3 className="node-detail-panel__section-title">基础信息</h3>
              <dl className="node-detail-panel__properties">
                {properties.map(([key, value]) => (
                  <div key={key} className="node-detail-panel__property">
                    <dt>{key}</dt>
                    <dd>{formatPropertyValue(value)}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}

          {parents.length > 0 ? (
            <section className="node-detail-panel__section">
              <h3 className="node-detail-panel__section-title">父节点 ({parents.length})</h3>
              <ul className="node-detail-panel__relations">
                {parents.map(({ node: parent, edgeType }) => (
                  <li key={`${parent.id}-${edgeType}`}>
                    <button type="button" onClick={() => onNodeSelect(parent.id)}>
                      <span className="node-detail-panel__relation-name">{getNodeDisplayName(parent)}</span>
                      <span className="node-detail-panel__relation-meta">
                        {getNodeLabel(parent)} · {edgeType}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {children.length > 0 ? (
            <section className="node-detail-panel__section">
              <h3 className="node-detail-panel__section-title">子节点 ({children.length})</h3>
              <ul className="node-detail-panel__relations">
                {children.map(({ node: child, edgeType }) => (
                  <li key={`${child.id}-${edgeType}`}>
                    <button type="button" onClick={() => onNodeSelect(child.id)}>
                      <span className="node-detail-panel__relation-name">{getNodeDisplayName(child)}</span>
                      <span className="node-detail-panel__relation-meta">
                        {getNodeLabel(child)} · {edgeType}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </ScrollArea>
      </div>
    </aside>
  );
}
