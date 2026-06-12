import { AppLogo } from "@/components/AppLogo";

interface GraphOverviewPanelProps {
  drugName: string;
  drugSubtitle?: string;
  totalNodes: number;
  totalEdges: number;
  visibleNodes: number;
}

export function GraphOverviewPanel({
  drugName,
  drugSubtitle,
  totalNodes,
  totalEdges,
  visibleNodes,
}: GraphOverviewPanelProps) {
  return (
    <aside className="glass-card graph-overview-panel">
      <div className="glass-card__glow glass-card__glow--blue" aria-hidden />
      <div className="glass-card__inner">
        <div className="app-brand app-brand--compact">
          <AppLogo size={20} />
          <p className="graph-overview-panel__label">MedSphere</p>
        </div>
        <h1 className="graph-overview-panel__title">{drugName}</h1>
        {drugSubtitle ? <p className="graph-overview-panel__subtitle">{drugSubtitle}</p> : null}
        <dl className="graph-overview-panel__stats">
          <div className="graph-overview-panel__stat">
            <dt>图谱节点</dt>
            <dd>{totalNodes}</dd>
          </div>
          <div className="graph-overview-panel__stat">
            <dt>关系</dt>
            <dd>{totalEdges}</dd>
          </div>
          <div className="graph-overview-panel__stat">
            <dt>已展开</dt>
            <dd>{visibleNodes}</dd>
          </div>
        </dl>
      </div>
    </aside>
  );
}
