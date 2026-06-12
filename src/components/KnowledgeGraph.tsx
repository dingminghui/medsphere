import { GraphEntityLegend } from "@/components/GraphEntityLegend";
import { GraphMapControls } from "@/components/GraphMapControls";
import { GraphOverviewPanel } from "@/components/GraphOverviewPanel";
import { NodeDetailPanel } from "@/components/NodeDetailPanel";
import {
  buildHubLinks,
  computeNodeLabelLayout,
  createBlobPath,
  getConnectedIds,
  getHubMemberIds,
  getInitialVisibleState,
  getNeighborIds,
  getNodeDisplayName,
  getNodePastelStyle,
  getNodeTooltipContent,
  getNodeRadius,
  isCategoryHub,
} from "@/lib/graph-utils";
import type { GraphData, GraphEdge, GraphNode } from "@/types/graph";
import * as d3 from "d3";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface KnowledgeGraphProps {
  data: GraphData;
}

interface SimNode extends GraphNode, d3.SimulationNodeDatum {}

interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  id: string;
  type: string;
}

interface GraphContext {
  simulation: d3.Simulation<SimNode, SimLink>;
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  linkSelection: d3.Selection<SVGPathElement, SimLink, SVGGElement, unknown>;
  nodeSelection: d3.Selection<SVGGElement, SimNode, SVGGElement, unknown>;
  tooltip: d3.Selection<HTMLDivElement, unknown, null, undefined>;
  allNodes: SimNode[];
  allLinks: SimLink[];
  nodeMap: Map<string, SimNode>;
  displayNodeById: Map<string, GraphNode>;
  clusterCenters: Map<string, { x: number; y: number }>;
  onNodeClick: (nodeId: string) => void;
  zoom: d3.ZoomBehavior<SVGSVGElement, unknown>;
  dragBehavior: d3.DragBehavior<SVGGElement, SimNode, SimNode | d3.SubjectPosition>;
}

interface ZoomControls {
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
  fitToView: () => void;
}

interface FocusCameraOptions {
  offsetX?: number;
  offsetY?: number;
  padding?: number;
  minScale?: number;
  maxScale?: number;
  singleNodeScale?: number;
}

function getFocusTransform(
  nodes: SimNode[],
  viewWidth: number,
  viewHeight: number,
  options: FocusCameraOptions = {},
): d3.ZoomTransform {
  const {
    offsetX = 0,
    offsetY = 0,
    padding = 88,
    minScale = 0.35,
    maxScale = 1.65,
    singleNodeScale = 1,
  } = options;

  if (viewWidth <= 0 || viewHeight <= 0) {
    return d3.zoomIdentity;
  }

  const positioned = nodes.filter((node) => node.x !== undefined && node.y !== undefined);
  if (positioned.length === 0) {
    return d3.zoomIdentity;
  }

  if (positioned.length === 1) {
    const node = positioned[0]!;
    const scale = Math.min(Math.max(singleNodeScale, minScale), maxScale);
    return d3.zoomIdentity
      .translate(viewWidth / 2 + offsetX, viewHeight / 2 + offsetY)
      .scale(scale)
      .translate(-(node.x ?? 0), -(node.y ?? 0));
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const node of positioned) {
    const radius = getNodeRadius(node) + 28;
    const x = node.x ?? 0;
    const y = node.y ?? 0;
    minX = Math.min(minX, x - radius);
    maxX = Math.max(maxX, x + radius);
    minY = Math.min(minY, y - radius);
    maxY = Math.max(maxY, y + radius);
  }

  const graphWidth = Math.max(maxX - minX, 1);
  const graphHeight = Math.max(maxY - minY, 1);
  const scale = Math.min(
    (viewWidth - padding * 2) / graphWidth,
    (viewHeight - padding * 2) / graphHeight,
    maxScale,
  );
  const midX = (minX + maxX) / 2;
  const midY = (minY + maxY) / 2;

  return d3.zoomIdentity
    .translate(viewWidth / 2 + offsetX, viewHeight / 2 + offsetY)
    .scale(Math.max(scale, minScale))
    .translate(-midX, -midY);
}

function getFitTransform(
  nodes: SimNode[],
  viewWidth: number,
  viewHeight: number,
): d3.ZoomTransform {
  return getFocusTransform(nodes, viewWidth, viewHeight, {
    padding: 80,
    minScale: 0.2,
    maxScale: 4,
  });
}

function collectFocusNodes(nodeMap: Map<string, SimNode>, ids: string[]): SimNode[] {
  const nodes: SimNode[] = [];
  for (const id of ids) {
    const node = nodeMap.get(id);
    if (node && node.x !== undefined && node.y !== undefined) {
      nodes.push(node);
    }
  }
  return nodes;
}

function raiseHubNodes(selection: d3.Selection<SVGGElement, SimNode, SVGGElement, unknown>) {
  selection.filter((datum) => isCategoryHub(datum)).raise();
}

function linkCurvePath(link: SimLink): string {
  const source = link.source as SimNode;
  const target = link.target as SimNode;
  const sx = source.x ?? 0;
  const sy = source.y ?? 0;
  const tx = target.x ?? 0;
  const ty = target.y ?? 0;
  const mx = (sx + tx) / 2;
  const my = (sy + ty) / 2;
  const dx = tx - sx;
  const dy = ty - sy;
  return `M${sx},${sy} Q${mx - dy * 0.08},${my + dx * 0.08} ${tx},${ty}`;
}

function hashSeed(id: string): number {
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash << 5) - hash + id.charCodeAt(index);
    hash |= 0;
  }
  return hash;
}

function clipId(nodeId: string): string {
  return `clip-${nodeId.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
}

export function KnowledgeGraph({ data }: KnowledgeGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<GraphContext | null>(null);
  const zoomControlsRef = useRef<ZoomControls | null>(null);
  const focusCameraRef = useRef<((ids: string[], offsetForPanel?: boolean) => void) | null>(null);
  const clusterOfNodeRef = useRef(new Map<string, string>());
  const selectedIdRef = useRef<string | null>(null);
  const visibleIdsRef = useRef<Set<string>>(new Set());

  const initialState = useMemo(() => {
    const width = typeof window !== "undefined" ? window.innerWidth : 1200;
    const height = typeof window !== "undefined" ? window.innerHeight : 800;
    return getInitialVisibleState(data, width, height);
  }, [data]);

  const displayNodeById = useMemo(() => {
    const map = new Map(data.nodes.map((node) => [node.id, node]));
    for (const hub of initialState.hubNodes) {
      map.set(hub.id, hub);
    }
    return map;
  }, [data.nodes, initialState.hubNodes]);

  const [visibleIds, setVisibleIds] = useState(() => new Set(initialState.visibleIds));
  const [depthMap, setDepthMap] = useState(() => new Map(initialState.depthMap));
  const [selectedId, setSelectedId] = useState<string | null>(null);

  selectedIdRef.current = selectedId;
  visibleIdsRef.current = visibleIds;

  const depthMapRef = useRef(depthMap);
  depthMapRef.current = depthMap;

  const rootNode = displayNodeById.get(initialState.rootId);
  const selectedNode =
    selectedId && !isCategoryHub(displayNodeById.get(selectedId) ?? { id: "", labels: [], properties: {} })
      ? displayNodeById.get(selectedId)
      : undefined;

  const drugName = rootNode ? getNodeDisplayName(rootNode) : "医药知识图谱";
  const drugSubtitle =
    typeof rootNode?.properties.drugClass === "string" ? rootNode.properties.drugClass : undefined;

  const visibleRealNodeCount = useMemo(
    () => [...visibleIds].filter((id) => !id.startsWith("hub:")).length,
    [visibleIds],
  );

  const scheduleCameraFocus = useCallback((ids: string[], offsetForPanel = false) => {
    const run = () => focusCameraRef.current?.(ids, offsetForPanel);
    window.setTimeout(run, 90);
    window.setTimeout(run, 360);
  }, []);

  const placeNewNodes = useCallback(
    (anchorId: string, newNodeIds: string[], nodeMap: Map<string, SimNode>, clusterId: string) => {
      const anchor = nodeMap.get(anchorId);
      const container = containerRef.current;
      const centerX = anchor?.x ?? (container?.clientWidth ?? 800) / 2;
      const centerY = anchor?.y ?? (container?.clientHeight ?? 600) / 2;
      const spread = Math.min(120, 56 + newNodeIds.length * 4);

      for (const nodeId of newNodeIds) {
        clusterOfNodeRef.current.set(nodeId, clusterId);
      }

      newNodeIds.forEach((nodeId, index) => {
        const node = nodeMap.get(nodeId);
        if (!node || node.x !== undefined) {
          return;
        }

        const angle = (2 * Math.PI * index) / Math.max(newNodeIds.length, 1);
        node.x = centerX + Math.cos(angle) * spread;
        node.y = centerY + Math.sin(angle) * spread;
        node.vx = 0;
        node.vy = 0;
      });
    },
    [],
  );

  const renderNodeGroup = (group: d3.Selection<SVGGElement, SimNode, SVGGElement, unknown>) => {
    group.each(function (datum) {
      const style = getNodePastelStyle(datum);
      const layout = computeNodeLabelLayout(datum);
      const radius = layout.radius;
      const seed = hashSeed(datum.id);
      const element = d3.select(this);
      const id = clipId(datum.id);
      const labelBox = radius * 1.62;

      element.selectAll("*").remove();
      element.attr("data-label-truncated", layout.isTruncated ? "true" : "false");

      const content = element.append("g").attr("class", "graph-node__content");

      content
        .append("path")
        .attr("class", "node-glow")
        .attr("d", createBlobPath(0, 0, radius * 1.3, seed + 1))
        .attr("fill", style.glow)
        .attr("opacity", 0.32)
        .attr("filter", "url(#soft-blur)");

      content
        .append("path")
        .attr("class", "node-body")
        .attr("d", createBlobPath(0, 0, radius, seed))
        .attr("fill", style.inner)
        .attr("stroke", style.outer)
        .attr("stroke-width", 2);

      content
        .append("clipPath")
        .attr("id", id)
        .append("path")
        .attr("d", createBlobPath(0, 0, radius * 0.9, seed));

      const labelWrap = content
        .append("foreignObject")
        .attr("class", "node-label-wrap")
        .attr("pointer-events", "none")
        .attr("x", -labelBox / 2)
        .attr("y", -labelBox / 2)
        .attr("width", labelBox)
        .attr("height", labelBox)
        .attr("clip-path", `url(#${id})`);

      const labelText = labelWrap
        .append("xhtml:div")
        .attr("class", "node-label-text")
        .style("font-size", `${layout.fontSize}px`)
        .style("line-height", "1.32")
        .style("color", style.text);

      layout.lines.forEach((line) => {
        labelText.append("xhtml:span").attr("class", "node-label-line").text(line);
      });
    });
  };

  const applyFocus = useCallback(
    (ctx: GraphContext, currentSelectedId: string | null) => {
      const focusSet = currentSelectedId
        ? getConnectedIds(currentSelectedId, data.edges, ctx.displayNodeById)
        : null;

      ctx.nodeSelection.attr("opacity", (datum) => {
        if (!focusSet || isCategoryHub(datum)) {
          return 1;
        }
        return focusSet.has(datum.id) ? 1 : 0.22;
      });

      ctx.nodeSelection.select(".node-body").attr("stroke-width", (datum) =>
        datum.id === currentSelectedId ? 3 : 2,
      );

      ctx.linkSelection
        .attr("stroke", (datum) => {
          if (!focusSet) {
            return "rgba(148, 163, 184, 0.28)";
          }
          const source = datum.source as SimNode;
          const target = datum.target as SimNode;
          const isConnected = focusSet.has(source.id) && focusSet.has(target.id);
          return isConnected ? "rgba(126, 164, 220, 0.75)" : "rgba(148, 163, 184, 0.06)";
        })
        .attr("stroke-width", (datum) => {
          if (!focusSet) {
            return 1.5;
          }
          const source = datum.source as SimNode;
          const target = datum.target as SimNode;
          const isConnected = focusSet.has(source.id) && focusSet.has(target.id);
          return isConnected ? 2.2 : 0.8;
        });
    },
    [data.edges],
  );

  const updateGraphStructure = useCallback(
    (currentVisibleIds: Set<string>, onNodeClick: (nodeId: string) => void) => {
      const ctx = graphRef.current;
      if (!ctx) {
        return;
      }

      ctx.onNodeClick = onNodeClick;

      const visibleNodes = ctx.allNodes.filter((node) => currentVisibleIds.has(node.id));
      const visibleLinks = ctx.allLinks.filter((link) => {
        const sourceId =
          typeof link.source === "string" ? link.source : (link.source as SimNode).id;
        const targetId =
          typeof link.target === "string" ? link.target : (link.target as SimNode).id;
        return currentVisibleIds.has(sourceId) && currentVisibleIds.has(targetId);
      });

      const existingIds = new Set(ctx.simulation.nodes().map((node) => node.id));

      ctx.linkSelection = ctx.linkSelection
        .data(visibleLinks, (link) => link.id)
        .join(
          (enter) =>
            enter
              .append("path")
              .attr("fill", "none")
              .attr("stroke", "rgba(148, 163, 184, 0.28)")
              .attr("stroke-width", 1.5)
              .attr("stroke-linecap", "round"),
          (update) => update,
          (exit) => exit.remove(),
        );

      ctx.nodeSelection = ctx.nodeSelection
        .data(visibleNodes, (datum) => datum.id)
        .join(
          (enter) => {
            const group = enter.append("g").attr("class", "graph-node").style("cursor", "pointer");
            group.attr("opacity", 0).transition().duration(280).attr("opacity", 1);
            renderNodeGroup(group);
            if (graphRef.current) {
              group.call(graphRef.current.dragBehavior);
            }
            return group;
          },
          (update) => {
            update
              .filter((datum) => !existingIds.has(datum.id))
              .each(function () {
                renderNodeGroup(d3.select(this));
              });
            return update;
          },
          (exit) => {
            exit.interrupt().attr("opacity", 0).remove();
          },
        );

      raiseHubNodes(ctx.nodeSelection);

      for (const node of visibleNodes) {
        if (!existingIds.has(node.id)) {
          continue;
        }
        node.vx = (node.vx ?? 0) * 0.2;
        node.vy = (node.vy ?? 0) * 0.2;
      }

      ctx.simulation.nodes(visibleNodes);
      (ctx.simulation.force("link") as d3.ForceLink<SimNode, SimLink>).links(visibleLinks);

      const addedCount = visibleNodes.filter((node) => !existingIds.has(node.id)).length;
      if (addedCount > 0) {
        ctx.simulation.alpha(0.12).restart();
      }

      applyFocus(ctx, selectedIdRef.current);
    },
    [applyFocus],
  );

  const handleNodeSelect = useCallback(
    (nodeId: string) => {
      const node = displayNodeById.get(nodeId);
      if (!node) {
        return;
      }

      if (isCategoryHub(node)) {
        setSelectedId(null);

        const memberIds = getHubMemberIds(node);
        if (memberIds.length === 0) {
          return;
        }

        const clusterId = nodeId;
        const hubSim = graphRef.current?.nodeMap.get(nodeId);
        if (hubSim && graphRef.current) {
          graphRef.current.clusterCenters.set(clusterId, {
            x: hubSim.x ?? 0,
            y: hubSim.y ?? 0,
          });
          placeNewNodes(nodeId, memberIds, graphRef.current.nodeMap, clusterId);
        }

        setVisibleIds((prevVisible) => {
          const nextVisible = new Set(prevVisible);
          nextVisible.delete(nodeId);
          for (const memberId of memberIds) {
            nextVisible.add(memberId);
          }
          return nextVisible;
        });

        setDepthMap((prevDepth) => {
          const nextDepth = new Map(prevDepth);
          nextDepth.delete(nodeId);
          for (const memberId of memberIds) {
            nextDepth.set(memberId, 1);
          }
          return nextDepth;
        });
        scheduleCameraFocus(memberIds);
        return;
      }

      setSelectedId(nodeId);

      const depth = depthMapRef.current.get(nodeId) ?? 0;
      const connectedIds = [...getConnectedIds(nodeId, data.edges, displayNodeById)].filter((id) =>
        visibleIdsRef.current.has(id),
      );
      const focusIds = connectedIds.length > 0 ? connectedIds : [nodeId];

      if (depth < 1) {
        scheduleCameraFocus(focusIds, true);
        return;
      }

      const clusterId = clusterOfNodeRef.current.get(nodeId) ?? nodeId;
      const newNeighborIds = getNeighborIds(nodeId, data.edges).filter(
        (id) => !visibleIdsRef.current.has(id),
      );

      if (newNeighborIds.length === 0) {
        scheduleCameraFocus(focusIds, true);
        return;
      }

      if (graphRef.current) {
        placeNewNodes(nodeId, newNeighborIds, graphRef.current.nodeMap, clusterId);
      }

      setVisibleIds((prevVisible) => {
        const nextVisible = new Set(prevVisible);
        for (const id of newNeighborIds) {
          nextVisible.add(id);
        }
        return nextVisible;
      });

      setDepthMap((prevDepth) => {
        const nextDepth = new Map(prevDepth);
        for (const id of newNeighborIds) {
          nextDepth.set(id, depth + 1);
        }
        return nextDepth;
      });

      scheduleCameraFocus([...new Set([nodeId, ...newNeighborIds, ...focusIds])], true);
    },
    [data.edges, displayNodeById, placeNewNodes, scheduleCameraFocus],
  );

  useEffect(() => {
    clusterOfNodeRef.current = new Map();
    for (const hub of initialState.hubNodes) {
      clusterOfNodeRef.current.set(hub.id, hub.id);
    }
    setVisibleIds(new Set(initialState.visibleIds));
    setDepthMap(new Map(initialState.depthMap));
    setSelectedId(null);
  }, [initialState]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    let width = container.clientWidth;
    let height = container.clientHeight;

    const allNodes: SimNode[] = [
      ...data.nodes.map((node) => ({ ...node })),
      ...initialState.hubNodes.map((hub) => ({ ...hub })),
    ];
    const nodeMap = new Map(allNodes.map((node) => [node.id, node]));

    const hubLinks = buildHubLinks(initialState.rootId, initialState.hubNodes);
    const allLinks: SimLink[] = [...data.edges, ...hubLinks]
      .filter((edge) => nodeMap.has(edge.source) && nodeMap.has(edge.target))
      .map((edge: GraphEdge) => ({
        id: edge.id,
        type: edge.type,
        source: edge.source,
        target: edge.target,
      }));

    const svg = d3
      .select(container)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("class", "knowledge-graph-svg");

    const defs = svg.append("defs");
    defs
      .append("filter")
      .attr("id", "soft-blur")
      .append("feGaussianBlur")
      .attr("stdDeviation", 8);

    const bokehBlur = defs
      .append("filter")
      .attr("id", "bokeh-blur")
      .attr("x", "-60%")
      .attr("y", "-60%")
      .attr("width", "220%")
      .attr("height", "220%");
    bokehBlur.append("feGaussianBlur").attr("stdDeviation", 28);

    const bokehGroup = svg.append("g").attr("class", "bokeh-layer");
    const bokehColors = ["#f8d0e0", "#d0e8f8", "#e8f0d0", "#f0e8d0", "#e0d8f8"];
    bokehColors.forEach((color, index) => {
      const gradientId = `bokeh-grad-${index}`;
      const gradient = defs
        .append("radialGradient")
        .attr("id", gradientId)
        .attr("cx", "50%")
        .attr("cy", "50%")
        .attr("r", "50%");

      gradient.append("stop").attr("offset", "0%").attr("stop-color", color).attr("stop-opacity", 0.38);
      gradient.append("stop").attr("offset", "42%").attr("stop-color", color).attr("stop-opacity", 0.16);
      gradient.append("stop").attr("offset", "100%").attr("stop-color", color).attr("stop-opacity", 0);

      bokehGroup
        .append("circle")
        .attr("cx", width * (0.12 + index * 0.19))
        .attr("cy", height * (0.18 + (index % 3) * 0.28))
        .attr("r", 140 + index * 50)
        .attr("fill", `url(#${gradientId})`)
        .attr("filter", "url(#bokeh-blur)");
    });

    const viewport = svg.append("g");

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on("zoom", (event) => {
        viewport.attr("transform", event.transform);
      });

    svg.call(zoom);

    focusCameraRef.current = (ids, offsetForPanel = false) => {
      const ctx = graphRef.current;
      if (!ctx || ids.length === 0) {
        return;
      }

      const nodes = collectFocusNodes(ctx.nodeMap, ids);
      if (nodes.length === 0) {
        return;
      }

      const transform = getFocusTransform(nodes, container.clientWidth, container.clientHeight, {
        offsetX: offsetForPanel ? -120 : 0,
        padding: nodes.length > 8 ? 112 : 92,
        maxScale: nodes.length > 8 ? 1.12 : nodes.length > 1 ? 1.45 : 1.05,
        singleNodeScale: 1.05,
      });

      ctx.svg
        .transition()
        .duration(460)
        .ease(d3.easeCubicOut)
        .call(ctx.zoom.transform, transform);
    };

    zoomControlsRef.current = {
      zoomIn: () => {
        svg.transition().duration(220).call(zoom.scaleBy, 1.32);
      },
      zoomOut: () => {
        svg.transition().duration(220).call(zoom.scaleBy, 1 / 1.32);
      },
      reset: () => {
        svg.transition().duration(320).call(zoom.transform, d3.zoomIdentity);
      },
      fitToView: () => {
        const ctx = graphRef.current;
        if (!ctx) {
          return;
        }
        const transform = getFitTransform(
          ctx.simulation.nodes(),
          container.clientWidth,
          container.clientHeight,
        );
        ctx.svg.transition().duration(360).call(ctx.zoom.transform, transform);
      },
    };

    const tooltip = d3
      .select(container)
      .append("div")
      .attr("class", "graph-tooltip")
      .style("opacity", 0);

    const linkGroup = viewport.append("g").attr("class", "links");
    const nodeGroup = viewport.append("g").attr("class", "nodes");

    const clusterCenters = new Map(initialState.clusterCenters);

    const rootSim = nodeMap.get(initialState.rootId);
    if (rootSim) {
      rootSim.x = initialState.rootCenter.x;
      rootSim.y = initialState.rootCenter.y;
      rootSim.vx = 0;
      rootSim.vy = 0;
    }

    initialState.hubNodes.forEach((hub) => {
      const center = clusterCenters.get(hub.id);
      const simNode = nodeMap.get(hub.id);
      if (center && simNode) {
        simNode.x = center.x;
        simNode.y = center.y;
        simNode.vx = 0;
        simNode.vy = 0;
      }
    });

    const dragBehavior = d3
      .drag<SVGGElement, SimNode>()
      .clickDistance(8)
      .on("start", (event, datum) => {
        const ctx = graphRef.current;
        if (!ctx) {
          return;
        }
        if (!event.active) {
          ctx.simulation.alphaTarget(0.08).restart();
        }
        datum.fx = datum.x;
        datum.fy = datum.y;
      })
      .on("drag", (event, datum) => {
        datum.fx = event.x;
        datum.fy = event.y;
      })
      .on("end", (event, datum) => {
        const ctx = graphRef.current;
        if (ctx && !event.active) {
          ctx.simulation.alphaTarget(0);
        }
        datum.fx = null;
        datum.fy = null;
      });

    nodeGroup
      .on("click", (event) => {
        const group = (event.target as Element | null)?.closest?.("g.graph-node");
        if (!group || !graphRef.current) {
          return;
        }
        event.stopPropagation();
        const datum = d3.select(group).datum() as SimNode;
        graphRef.current.onNodeClick(datum.id);
      })
      .on("mouseover", (event) => {
        const group = (event.target as Element | null)?.closest?.("g.graph-node");
        if (!group) {
          return;
        }
        d3.select(group).raise();
        const datum = d3.select(group).datum() as SimNode;
        const tooltipContent = getNodeTooltipContent(datum);
        tooltip.selectAll("*").remove();
        tooltip
          .append("div")
          .attr("class", "graph-tooltip__title")
          .text(tooltipContent.title);
        tooltipContent.lines.forEach((line) => {
          tooltip.append("div").attr("class", "graph-tooltip__line").text(line);
        });
        tooltip.transition().duration(120).style("opacity", 1);
      })
      .on("mousemove", (event) => {
        const bounds = container.getBoundingClientRect();
        tooltip
          .style("left", `${event.clientX - bounds.left + 14}px`)
          .style("top", `${event.clientY - bounds.top + 14}px`);
      })
      .on("mouseout", () => {
        tooltip.transition().duration(100).style("opacity", 0);
      });

    const simulation = d3
      .forceSimulation<SimNode>([])
      .velocityDecay(0.65)
      .alphaDecay(0.12)
      .force(
        "link",
        d3
          .forceLink<SimNode, SimLink>([])
          .id((node) => node.id)
          .distance((link) => (link.type === "CATEGORY" ? 170 : 100))
          .strength((link) => (link.type === "CATEGORY" ? 0.35 : 0.15)),
      )
      .force("charge", d3.forceManyBody().strength(-140))
      .force("collide", d3.forceCollide((node) => getNodeRadius(node) + 14).strength(0.85))
      .force(
        "clusterX",
        d3
          .forceX<SimNode>((node) => {
            const clusterId = clusterOfNodeRef.current.get(node.id) ?? node.id;
            return clusterCenters.get(clusterId)?.x ?? width / 2;
          })
          .strength(0.035),
      )
      .force(
        "clusterY",
        d3
          .forceY<SimNode>((node) => {
            const clusterId = clusterOfNodeRef.current.get(node.id) ?? node.id;
            return clusterCenters.get(clusterId)?.y ?? height / 2;
          })
          .strength(0.035),
      );

    graphRef.current = {
      simulation,
      svg,
      linkSelection: linkGroup.selectAll<SVGPathElement, SimLink>("path"),
      nodeSelection: nodeGroup.selectAll<SVGGElement, SimNode>("g.graph-node"),
      tooltip,
      allNodes,
      allLinks,
      nodeMap,
      displayNodeById,
      clusterCenters,
      onNodeClick: handleNodeSelect,
      zoom,
      dragBehavior,
    };

    simulation.on("tick", () => {
      const ctx = graphRef.current;
      if (!ctx) {
        return;
      }

      ctx.linkSelection.attr("d", linkCurvePath);
      ctx.nodeSelection.attr("transform", (datum) => `translate(${datum.x ?? 0},${datum.y ?? 0})`);
    });

    svg.on("click", () => {
      setSelectedId(null);
    });

    const resizeObserver = new ResizeObserver(() => {
      width = container.clientWidth;
      height = container.clientHeight;
      svg.attr("width", width).attr("height", height);
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      simulation.stop();
      graphRef.current = null;
      zoomControlsRef.current = null;
      focusCameraRef.current = null;
      d3.select(container).selectAll("*").remove();
    };
  }, [
    data,
    displayNodeById,
    handleNodeSelect,
    initialState.clusterCenters,
    initialState.hubNodes,
    initialState.rootCenter,
    initialState.rootId,
  ]);

  useEffect(() => {
    const ctx = graphRef.current;
    if (!ctx) {
      return;
    }
    updateGraphStructure(visibleIds, handleNodeSelect);
  }, [visibleIds, handleNodeSelect, updateGraphStructure]);

  useEffect(() => {
    const ctx = graphRef.current;
    if (!ctx) {
      return;
    }
    applyFocus(ctx, selectedId);
  }, [selectedId, applyFocus]);

  return (
    <div className="knowledge-graph">
      <GraphOverviewPanel
        drugName={drugName}
        drugSubtitle={drugSubtitle}
        totalNodes={data.nodes.length}
        totalEdges={data.edges.length}
        visibleNodes={visibleRealNodeCount}
      />
      <div ref={containerRef} className="knowledge-graph__canvas" />
      {selectedNode ? (
        <NodeDetailPanel
          node={selectedNode}
          data={data}
          nodeById={displayNodeById}
          onNodeSelect={handleNodeSelect}
          onClose={() => setSelectedId(null)}
        />
      ) : null}
      <div className="graph-bottom-left">
        <GraphEntityLegend data={data} />
      </div>
      <div className="graph-bottom-right">
        <GraphMapControls
          onZoomIn={() => zoomControlsRef.current?.zoomIn()}
          onZoomOut={() => zoomControlsRef.current?.zoomOut()}
          onReset={() => zoomControlsRef.current?.reset()}
          onFit={() => zoomControlsRef.current?.fitToView()}
        />
      </div>
    </div>
  );
}
