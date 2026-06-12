import { ScrollArea } from "@/components/ui/ScrollArea";
import { getGraphLegendItems, getNodePastelStyle } from "@/lib/graph-utils";
import type { GraphData, GraphNode } from "@/types/graph";
import type { CSSProperties } from "react";
import { useMemo } from "react";

interface GraphEntityLegendProps {
  data: GraphData;
}

function legendNode(label: string): GraphNode {
  return { id: `legend:${label}`, labels: [label], properties: {} };
}

function LegendIcon() {
  return (
    <svg className="graph-entity-legend__icon" viewBox="0 0 24 24" aria-hidden>
      <path d="M12 4.5 17 14H7L12 4.5Z" />
      <rect x="4" y="15.5" width="7" height="5" rx="1" />
      <circle cx="18" cy="18" r="3" />
    </svg>
  );
}

export function GraphEntityLegend({ data }: GraphEntityLegendProps) {
  const items = useMemo(() => getGraphLegendItems(data), [data]);
  const totalNodes = useMemo(() => items.reduce((sum, item) => sum + item.count, 0), [items]);

  return (
    <aside className="glass-card graph-entity-legend" aria-label="实体图例">
      <div className="glass-card__glow glass-card__glow--mint" aria-hidden />
      <div className="glass-card__inner graph-entity-legend__inner">
        <header className="graph-entity-legend__header">
          <LegendIcon />
          <div className="graph-entity-legend__heading">
            <h2 className="graph-entity-legend__title">实体图例</h2>
            <p className="graph-entity-legend__meta">
              {items.length} 类 · {totalNodes} 个节点
            </p>
          </div>
        </header>
        <ScrollArea className="graph-entity-legend__scroll" type="always">
          <ul className="graph-entity-legend__list">
            {items.map(({ label, nameCn, count }) => {
              const style = getNodePastelStyle(legendNode(label));

              return (
                <li key={label} className="graph-entity-legend__item">
                  <span
                    className="graph-entity-legend__dot"
                    style={
                      {
                        "--legend-inner": style.inner,
                        "--legend-glow": style.glow,
                      } as CSSProperties
                    }
                    aria-hidden
                  />
                  <span className="graph-entity-legend__label">
                    <span className="graph-entity-legend__name">{nameCn}</span>
                    <span className="graph-entity-legend__count">{count}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </ScrollArea>
      </div>
    </aside>
  );
}
