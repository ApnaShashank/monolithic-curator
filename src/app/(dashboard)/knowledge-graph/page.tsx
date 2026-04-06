'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import Link from 'next/link';

interface Node extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  type: string;
  tags: string[];
  url?: string;
  source?: string;
  author?: string;
  createdAt?: string;
  size: number;
}

interface Edge extends d3.SimulationLinkDatum<Node> {
  source: string | Node;
  target: string | Node;
  weight: number;
  reason: string;
}

interface GraphData {
  nodes: Node[];
  edges: Edge[];
  stats: { nodes: number; connections: number };
}

const TYPE_COLORS: Record<string, string> = {
  article: '#ffffff',
  video: '#999999',
  pdf: '#666666',
  tweet: '#cccccc',
  image: '#aaaaaa',
  note: '#dddddd',
  link: '#888888',
};

export default function KnowledgeGraph() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    fetch('/api/graph')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load graph');
        return r.json();
      })
      .then((data: GraphData) => {
        setGraphData(data);
      })
      .catch((e) => {
        console.error(e);
        setError(e.message);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!graphData || !svgRef.current || dimensions.width === 0) return;

    const { width, height } = dimensions;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const container = svg.append("g");

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
      });
    
    zoomRef.current = zoom;
    svg.call(zoom);

    const simulation = d3.forceSimulation<Node>(graphData.nodes)
      .force("link", d3.forceLink<Node, Edge>(graphData.edges).id(d => d.id).distance(150))
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(d => (d as Node).size + 40))
      .force("x", d3.forceX(width / 2).strength(0.05))
      .force("y", d3.forceY(height / 2).strength(0.05));

    // Glow Filter
    const defs = svg.append("defs");
    const filter = defs.append("filter")
      .attr("id", "glow")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");
      
    filter.append("feGaussianBlur")
      .attr("stdDeviation", "4")
      .attr("result", "coloredBlur");
      
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    const link = container.append("g")
      .selectAll("line")
      .data(graphData.edges)
      .join("line")
      .attr("stroke", "rgba(255,255,255,0.06)")
      .attr("stroke-width", d => Math.sqrt(d.weight || 1))
      .attr("opacity", 0.6);

    const node = container.append("g")
      .selectAll("g")
      .data(graphData.nodes)
      .join("g")
      .call(drag(simulation))
      .on("click", (event, d) => {
        setSelectedNode(d as Node);
      })
      .on("mouseenter", (event, d) => {
        const connectedIds = new Set(
          graphData.edges
            .filter(e => (e.source as any).id === d.id || (e.target as any).id === d.id)
            .flatMap(e => [(e.source as any).id, (e.target as any).id])
        );

        node.attr("opacity", n => connectedIds.has(n.id) ? 1 : 0.1);
        link.attr("stroke", e => ((e.source as any).id === d.id || (e.target as any).id === d.id) ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.02)")
            .attr("opacity", e => ((e.source as any).id === d.id || (e.target as any).id === d.id) ? 1 : 0.05)
            .attr("stroke-width", e => ((e.source as any).id === d.id || (e.target as any).id === d.id) ? 2 : 1);
        
        d3.select(event.currentTarget).select("circle")
          .attr("filter", "url(#glow)")
          .attr("stroke-width", 3);
      })
      .on("mouseleave", () => {
        node.attr("opacity", 1);
        link.attr("stroke", "rgba(255,255,255,0.06)")
            .attr("opacity", 0.6)
            .attr("stroke-width", d => Math.sqrt(d.weight || 1));
        
        node.selectAll("circle")
          .attr("filter", null)
          .attr("stroke-width", 1.5);
      });

    node.append("circle")
      .attr("r", d => d.size)
      .attr("fill", "#050505")
      .attr("stroke", d => TYPE_COLORS[d.type] || "#ffffff")
      .attr("stroke-width", 1.5);

    node.append("text")
      .text(d => d.label.length > 20 ? d.label.slice(0, 17) + "..." : d.label)
      .attr("x", d => d.size + 8)
      .attr("y", 4)
      .attr("fill", "rgba(255,255,255,0.25)")
      .attr("font-size", "10px")
      .attr("font-family", "Inter, sans-serif")
      .attr("pointer-events", "none");

    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as Node).x!)
        .attr("y1", d => (d.source as Node).y!)
        .attr("x2", d => (d.target as Node).x!)
        .attr("y2", d => (d.target as Node).y!);

      node.attr("transform", d => `translate(${d.x},${d.y})`);
    });

    function drag(simulation: d3.Simulation<Node, undefined>) {
      function dragstarted(event: d3.D3DragEvent<SVGElement, Node, Node>) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }
      function dragged(event: d3.D3DragEvent<SVGElement, Node, Node>) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }
      function dragended(event: d3.D3DragEvent<SVGElement, Node, Node>) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }
      return d3.drag<any, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    }
  }, [graphData]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pt-14 md:pl-60 flex flex-col items-center justify-center overflow-hidden bg-[#050505]"
    >
      {/* Grid Background */}
      <div className="absolute inset-0" style={{
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      {/* HUD Stats */}
      <div className="absolute top-20 left-6 md:left-[260px] z-20 flex flex-wrap gap-2 pointer-events-none px-4">
        <div className="bg-black/60 backdrop-blur-xl px-4 py-2.5 rounded-xl border border-white/[0.06] pointer-events-auto">
          <span className="text-[8px] text-white/20 font-medium tracking-widest uppercase block mb-0.5">Nodes</span>
          <span className="text-lg font-headline font-bold text-white">
            {loading ? <div className="w-6 h-4 bg-white/5 animate-pulse rounded" /> : graphData?.stats.nodes ?? 0}
          </span>
        </div>
        <div className="bg-black/60 backdrop-blur-xl px-4 py-2.5 rounded-xl border border-white/[0.06] pointer-events-auto">
          <span className="text-[8px] text-white/20 font-medium tracking-widest uppercase block mb-0.5">Links</span>
          <span className="text-lg font-headline font-bold text-white">
            {loading ? <div className="w-6 h-4 bg-white/5 animate-pulse rounded" /> : graphData?.stats.connections ?? 0}
          </span>
        </div>
        {!loading && (
          <button
            onClick={() => {
              if (svgRef.current && zoomRef.current) {
                d3.select(svgRef.current).transition().duration(750).call(zoomRef.current.transform, d3.zoomIdentity);
              }
            }}
            className="bg-black/60 backdrop-blur-xl px-4 py-2.5 rounded-xl border border-white/[0.06] hover:bg-white/[0.05] transition-all pointer-events-auto flex flex-col items-center justify-center min-w-[60px]"
          >
             <span className="material-symbols-outlined text-white/20 text-[14px]">center_focus_strong</span>
             <span className="text-[7px] text-white/20 uppercase tracking-tighter mt-0.5">Center</span>
          </button>
        )}
      </div>

      <div className="absolute top-20 right-6 z-20 text-[9px] text-white/10 font-medium uppercase tracking-widest hidden md:block">
        Drag to explore • Scroll to zoom
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center gap-3 animate-pulse z-10">
           <div className="w-12 h-12 rounded-full border border-white/10 border-t-white/40 animate-spin" />
           <p className="text-[10px] text-white/15 uppercase tracking-widest font-medium">Mapping neural connections</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="flex flex-col items-center gap-3 z-10">
          <span className="material-symbols-outlined text-white/10 text-5xl">error</span>
          <p className="text-sm text-white/25">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && graphData && graphData.nodes.length === 0 && (
        <div className="flex flex-col items-center gap-3 z-10">
          <span className="material-symbols-outlined text-white/10 text-5xl">hub</span>
          <p className="text-sm text-white/25">No items saved yet. Add links to build your knowledge graph.</p>
        </div>
      )}

      {/* Type Legend */}
      {!loading && graphData && graphData.nodes.length > 0 && (
        <div className="absolute bottom-6 left-auto md:left-[260px] z-20 flex gap-2 px-4 flex-wrap">
          {Object.entries(TYPE_COLORS)
            .filter(([type]) => graphData.nodes.some(n => n.type === type))
            .map(([type, color]) => (
              <div key={type} className="flex items-center gap-1.5 bg-black/60 backdrop-blur-xl px-2.5 py-1.5 rounded-lg border border-white/[0.06]">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-[8px] text-white/25 font-medium uppercase tracking-widest">{type}</span>
              </div>
            ))}
        </div>
      )}

      <svg
        ref={svgRef}
        className="w-full h-full cursor-grab active:cursor-grabbing outline-none"
      />

      {/* Detail Panel */}
      {selectedNode && (
        <aside className="absolute right-0 top-14 h-[calc(100vh-3.5rem)] w-[380px] bg-black/90 backdrop-blur-xl border-l border-white/[0.04] z-40 flex flex-col shadow-2xl">
           <div className="p-6 flex-1 overflow-y-auto">
              <button 
                onClick={() => setSelectedNode(null)}
                className="mb-6 flex items-center gap-1.5 text-[10px] text-white/20 hover:text-white/60 transition-colors uppercase tracking-widest font-medium"
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span> Back
              </button>

              <div className="space-y-5">
                <div>
                   <span className="inline-block px-1.5 py-0.5 rounded bg-white/[0.06] text-[9px] text-white/30 font-medium uppercase tracking-widest mb-3">
                     {selectedNode.type}
                   </span>
                   <h1 className="text-2xl font-headline font-bold text-white leading-snug tracking-tight">
                     {selectedNode.label}
                   </h1>
                </div>

                {/* Meta info */}
                <div className="space-y-2">
                  {selectedNode.source && (
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[14px] text-white/10">language</span>
                      <span className="text-[10px] text-white/25 font-medium">{selectedNode.source}</span>
                    </div>
                  )}
                  {selectedNode.author && (
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[14px] text-white/10">person</span>
                      <span className="text-[10px] text-white/25">{selectedNode.author}</span>
                    </div>
                  )}
                  {selectedNode.createdAt && (
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[14px] text-white/10">calendar_today</span>
                      <span className="text-[10px] text-white/25">
                        {new Date(selectedNode.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                  )}
                  {selectedNode.url && (
                    <a 
                      href={selectedNode.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 hover:text-white/50 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[14px] text-white/10">link</span>
                      <span className="text-[10px] text-white/25 truncate max-w-[250px] underline underline-offset-2">{selectedNode.url}</span>
                    </a>
                  )}
                </div>

                {selectedNode.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedNode.tags.map(t => (
                      <span key={t} className="text-[9px] bg-white/[0.04] px-2 py-0.5 rounded text-white/25 font-medium">
                         #{t}
                      </span>
                    ))}
                  </div>
                )}

                <div className="pt-5 border-t border-white/[0.04] space-y-4">
                   <div className="flex items-center justify-between">
                     <h3 className="text-[9px] font-medium text-white/15 uppercase tracking-widest">Connected</h3>
                     <span className="text-[9px] text-white/10 font-medium">
                       {graphData?.edges.filter(e => (e.source as any).id === selectedNode.id || (e.target as any).id === selectedNode.id).length || 0} links
                     </span>
                   </div>
                   <div className="space-y-2">
                      {graphData?.edges
                        .filter(e => (e.source as any).id === selectedNode.id || (e.target as any).id === selectedNode.id)
                        .slice(0, 8)
                        .map((edge, i) => {
                          const otherNode = (edge.source as any).id === selectedNode.id ? (edge.target as any) : (edge.source as any);
                          return (
                            <Link 
                              key={i} 
                              href={`/item/${otherNode.id}`}
                              className="block p-3 glass-card hover:bg-white/[0.05] transition-all group"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[8px] font-medium text-white/15 uppercase tracking-wider">{edge.reason || 'semantic link'}</span>
                                <span className="material-symbols-outlined text-[10px] text-white/10 opacity-0 group-hover:opacity-100 transition-opacity">open_in_new</span>
                              </div>
                              <p className="text-[11px] font-medium text-white/50 line-clamp-1">{otherNode.label}</p>
                            </Link>
                          );
                        })}
                   </div>
                </div>
              </div>
           </div>

           <div className="p-6 border-t border-white/[0.04]">
              <Link
                href={`/item/${selectedNode.id}`}
                className="block text-center py-3 bg-white text-black text-xs font-semibold hover:bg-white/90 transition-all rounded-xl"
              >
                Open Artifact
              </Link>
           </div>
        </aside>
      )}
    </div>
  );
}
