import { AddGraphDialog } from "@/components/AddGraphDialog";
import { AppLogo } from "@/components/AppLogo";
import { GraphProjectCard } from "@/components/GraphProjectCard";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { ensureDefaultProject, getAllProjects } from "@/lib/graph-storage";
import type { GraphProject } from "@/types/project";
import { useCallback, useEffect, useState } from "react";

export function GraphList() {
  const [projects, setProjects] = useState<GraphProject[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  const refreshProjects = useCallback(() => {
    ensureDefaultProject();
    setProjects(getAllProjects());
  }, []);

  useEffect(() => {
    refreshProjects();
  }, [refreshProjects]);

  return (
    <main className="graph-list-shell">
      <div className="graph-list-shell__glow graph-list-shell__glow--left" aria-hidden />
      <div className="graph-list-shell__glow graph-list-shell__glow--right" aria-hidden />

      <div className="graph-list-page">
        <header className="graph-list-page__header">
          <div>
            <div className="app-brand">
              <AppLogo size={36} />
              <p className="graph-list-page__label">MedSphere</p>
            </div>
            <h1 className="graph-list-page__title">知识图谱</h1>
            <p className="graph-list-page__subtitle">管理并探索医药知识网络</p>
          </div>
          <button type="button" className="graph-list-page__add-btn" onClick={() => setDialogOpen(true)}>
            新增图谱
          </button>
        </header>

        <ScrollArea className="graph-list-page__scroll">
          <div className="graph-list-page__grid">
            {projects.map((project) => (
              <GraphProjectCard key={project.id} project={project} />
            ))}
          </div>
        </ScrollArea>
      </div>

      <AddGraphDialog open={dialogOpen} onOpenChange={setDialogOpen} onCreated={refreshProjects} />
    </main>
  );
}
