import type { GraphData } from "@/types/graph";

export interface GraphProject {
  id: string;
  title: string;
  graph: GraphData;
  nodeCount: number;
  edgeCount: number;
  createdAt: number;
  updatedAt: number;
}
