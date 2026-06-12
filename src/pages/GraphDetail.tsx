import { KnowledgeGraph } from "@/components/KnowledgeGraph";
import { getProject } from "@/lib/graph-storage";
import { Link, useParams } from "react-router";

export function GraphDetail() {
  const { id } = useParams<{ id: string }>();
  const project = id ? getProject(id) : undefined;

  if (!project) {
    return (
      <main className="graph-list-shell">
        <div className="graph-detail-empty glass-card">
          <div className="glass-card__inner graph-detail-empty__inner">
            <h1>图谱不存在</h1>
            <p>该图谱可能已被删除，或链接无效。</p>
            <Link to="/" className="graph-detail-empty__link">
              返回列表
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="graph-shell">
      <KnowledgeGraph data={project.graph} />
    </main>
  );
}
