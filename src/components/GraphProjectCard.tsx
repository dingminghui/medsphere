import { formatProjectDate } from "@/lib/graph-storage";
import type { GraphProject } from "@/types/project";
import { Link } from "react-router";

interface GraphProjectCardProps {
  project: GraphProject;
}

export function GraphProjectCard({ project }: GraphProjectCardProps) {
  return (
    <Link to={`/graph/${project.id}`} className="glass-card graph-project-card">
      <div className="glass-card__glow glass-card__glow--blue" aria-hidden />
      <div className="glass-card__inner graph-project-card__inner">
        <h2 className="graph-project-card__title">{project.title}</h2>
        <dl className="graph-project-card__stats">
          <div>
            <dt>节点</dt>
            <dd>{project.nodeCount}</dd>
          </div>
          <div>
            <dt>关系</dt>
            <dd>{project.edgeCount}</dd>
          </div>
        </dl>
        <p className="graph-project-card__time">创建时间：{formatProjectDate(project.createdAt)}</p>
      </div>
    </Link>
  );
}
