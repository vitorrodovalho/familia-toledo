"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import type { Branch, Person } from "@/types/family";
import { useFamilyStore } from "@/store/familyStore";
import { normalizeForSearch } from "@/components/shared/SearchBar";

// ─── Layout constants ────────────────────────────────────────────────────────

const NODE_R = 24;
const LEVEL_SEP = 130;
const NODE_CELL = 68; // d3 nodeSize horizontal (center-to-center)

// ─── Branch colours ──────────────────────────────────────────────────────────

const BRANCH_STROKE: Record<Branch, string> = {
  toledo_espanha: "#3b82f6",
  rodovalho:      "#22c55e",
  toledo_pisa:    "#a855f7",
  toledo_rodovalho: "#f97316",
};

const BRANCH_FILL: Record<Branch, string> = {
  toledo_espanha:   "#1e3a8a",
  rodovalho:        "#14532d",
  toledo_pisa:      "#581c87",
  toledo_rodovalho: "#7c2d12",
};

const BRANCH_LABEL: Record<Branch, string> = {
  toledo_espanha:   "Toledo ES/MX",
  rodovalho:        "Rodovalho",
  toledo_pisa:      "Toledo Pisa",
  toledo_rodovalho: "Toledo Rodovalho",
};

// ─── Tree datum types ─────────────────────────────────────────────────────────

interface TreeDatum {
  person: Person;
  children?: TreeDatum[] | undefined;
}

function buildDescendants(
  id: string,
  byId: ReadonlyMap<string, Person>,
  maxDepth: number,
  depth = 0,
  seen = new Set<string>(),
): TreeDatum | null {
  if (depth > maxDepth || seen.has(id)) return null;
  const person = byId.get(id);
  if (!person) return null;
  seen.add(id);
  const children = person.children
    .map((cid) => buildDescendants(cid, byId, maxDepth, depth + 1, seen))
    .filter((c): c is TreeDatum => c !== null);
  return { person, children: children.length ? children : undefined };
}

function buildAncestors(
  id: string,
  byId: ReadonlyMap<string, Person>,
  maxDepth: number,
  depth = 0,
  seen = new Set<string>(),
): TreeDatum | null {
  if (depth > maxDepth || seen.has(id)) return null;
  const person = byId.get(id);
  if (!person) return null;
  seen.add(id);
  const parents = person.parents
    .slice(0, 2)
    .map((pid) => buildAncestors(pid, byId, maxDepth, depth + 1, seen))
    .filter((p): p is TreeDatum => p !== null);
  return { person, children: parents.length ? parents : undefined };
}

// ─── Layout computation ───────────────────────────────────────────────────────

interface LayoutNode { id: string; person: Person; x: number; y: number }
interface LayoutLink { x1: number; y1: number; x2: number; y2: number }

function computeLayout(datum: TreeDatum | null, flipY: boolean) {
  if (!datum) return { nodes: [] as LayoutNode[], links: [] as LayoutLink[] };

  const root = d3.hierarchy<TreeDatum>(datum, (d) => d.children);

  d3.tree<TreeDatum>()
    .nodeSize([NODE_CELL, LEVEL_SEP])
    .separation((a, b) => (a.parent === b.parent ? 1.3 : 2))(root);

  const sign = flipY ? -1 : 1;

  const nodes: LayoutNode[] = root.descendants().map((n) => ({
    id: n.data.person.id,
    person: n.data.person,
    x: n.x as number,
    y: (n.y as number) * sign,
  }));

  const links: LayoutLink[] = root.links().map((l) => ({
    x1: l.source.x as number,
    y1: (l.source.y as number) * sign,
    x2: l.target.x as number,
    y2: (l.target.y as number) * sign,
  }));

  return { nodes, links };
}

function pathD(x1: number, y1: number, x2: number, y2: number): string {
  const mid = (y1 + y2) / 2;
  return `M ${x1} ${y1} C ${x1} ${mid}, ${x2} ${mid}, ${x2} ${y2}`;
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

// ─── Transform helpers ────────────────────────────────────────────────────────

interface Transform { x: number; y: number; scale: number }

function fitTransform(nodes: LayoutNode[], svgW: number, svgH: number): Transform {
  if (!nodes.length) return { x: svgW / 2, y: svgH / 2, scale: 1 };
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const n of nodes) {
    minX = Math.min(minX, n.x);
    maxX = Math.max(maxX, n.x);
    minY = Math.min(minY, n.y);
    maxY = Math.max(maxY, n.y);
  }
  const pad = NODE_R * 4 + 40;
  const treeW = maxX - minX + pad * 2;
  const treeH = maxY - minY + pad * 2 + 40; // extra for text below nodes
  const scale = Math.min(1.2, (svgW - 40) / treeW, (svgH - 40) / treeH);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  return { x: svgW / 2 - cx * scale, y: svgH / 2 - cy * scale, scale };
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface FamilyTreeProps {
  persons: Person[];
  personsById: ReadonlyMap<string, Person>;
  rootId: string | null;
  onRootChange: (id: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FamilyTree({ persons, personsById, rootId, onRootChange }: FamilyTreeProps) {
  const setSelectedPerson = useFamilyStore((s) => s.setSelectedPerson);
  const selectedPersonId  = useFamilyStore((s) => s.selectedPersonId);

  const [mode, setMode]   = useState<"descendants" | "ancestors">("descendants");
  const [depth, setDepth] = useState(3);
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 });
  const [failedImages, setFailedImages] = useState(new Set<string>());
  const [searchQuery, setSearchQuery]   = useState("");
  const [searchOpen, setSearchOpen]     = useState(false);
  const [searchResults, setSearchResults] = useState<Person[]>([]);

  const svgRef     = useRef<SVGSVGElement>(null);
  const isDragging = useRef(false);
  const hasMoved   = useRef(false);
  const lastPt     = useRef({ x: 0, y: 0 });

  // ── Build & layout ──────────────────────────────────────────────────────────

  const datum = useMemo(() => {
    if (!rootId) return null;
    return mode === "descendants"
      ? buildDescendants(rootId, personsById, depth)
      : buildAncestors(rootId, personsById, depth);
  }, [rootId, personsById, mode, depth]);

  const { nodes, links } = useMemo(
    () => computeLayout(datum, mode === "ancestors"),
    [datum, mode],
  );

  // ── Auto-fit when layout changes ─────────────────────────────────────────────

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || !nodes.length) return;
    const { width, height } = svg.getBoundingClientRect();
    setTransform(fitTransform(nodes, width, height));
  }, [nodes]);

  // ── Zoom via wheel ───────────────────────────────────────────────────────────

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    setTransform((prev) => {
      const factor   = e.deltaY > 0 ? 0.88 : 1.14;
      const newScale = Math.max(0.12, Math.min(4, prev.scale * factor));
      const ratio    = newScale / prev.scale;
      return { x: mx - (mx - prev.x) * ratio, y: my - (my - prev.y) * ratio, scale: newScale };
    });
  }, []);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    svg.addEventListener("wheel", handleWheel, { passive: false });
    return () => svg.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  // ── Pan via drag ─────────────────────────────────────────────────────────────

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    isDragging.current = true;
    hasMoved.current   = false;
    lastPt.current     = { x: e.clientX, y: e.clientY };
    svgRef.current?.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastPt.current.x;
    const dy = e.clientY - lastPt.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasMoved.current = true;
    lastPt.current = { x: e.clientX, y: e.clientY };
    setTransform((prev) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
  };

  const onPointerUp = () => { isDragging.current = false; };

  // ── Node click handlers ──────────────────────────────────────────────────────

  const handleNodeClick = useCallback(
    (person: Person, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!hasMoved.current) setSelectedPerson(person.id);
    },
    [setSelectedPerson],
  );

  const handleNodeDblClick = useCallback(
    (person: Person, e: React.MouseEvent) => {
      e.stopPropagation();
      onRootChange(person.id);
    },
    [onRootChange],
  );

  // ── Search ───────────────────────────────────────────────────────────────────

  const searchable = useMemo(
    () => persons.map((p) => ({ person: p, norm: normalizeForSearch(p.name) })),
    [persons],
  );

  useEffect(() => {
    const norm = normalizeForSearch(searchQuery);
    if (norm.length < 2) { setSearchResults([]); return; }
    const results = searchable
      .filter(({ norm: n }) => n.includes(norm))
      .slice(0, 12)
      .map(({ person }) => person);
    setSearchResults(results);
    setSearchOpen(results.length > 0);
  }, [searchQuery, searchable]);

  const handleImageError = useCallback((id: string) => {
    setFailedImages((prev) => new Set(prev).add(id));
  }, []);

  const fitView = () => {
    const svg = svgRef.current;
    if (!svg || !nodes.length) return;
    const { width, height } = svg.getBoundingClientRect();
    setTransform(fitTransform(nodes, width, height));
  };

  const rootPerson = rootId ? personsById.get(rootId) : null;

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full flex-col select-none">

      {/* ── Controls bar ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 bg-[#0A0F1A]/90 px-4 py-2.5 backdrop-blur">

        {/* Search */}
        <div className="relative shrink-0">
          <input
            className="h-9 w-52 border border-white/15 bg-white/8 px-3 text-sm text-white outline-none placeholder:text-sand/40 focus:border-white/30"
            placeholder="Buscar pessoa…"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); }}
            onFocus={() => setSearchOpen(searchResults.length > 0)}
            onBlur={() => window.setTimeout(() => setSearchOpen(false), 180)}
          />
          {searchOpen && searchResults.length > 0 ? (
            <div className="absolute left-0 top-10 z-50 max-h-64 w-72 overflow-y-auto border border-white/15 bg-[#0D1526]/97 shadow-2xl">
              {searchResults.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="flex w-full flex-col gap-0.5 px-3 py-2 text-left transition hover:bg-white/10"
                  onMouseDown={() => {
                    onRootChange(p.id);
                    setSearchQuery(p.name);
                    setSearchOpen(false);
                  }}
                >
                  <span className="truncate text-sm font-medium text-white">{p.name}</span>
                  <span className="text-xs text-sand/45">
                    {p.birth_year ? `${p.birth_year} · ` : ""}
                    {p.generation_level}ª geração · {BRANCH_LABEL[p.branch]}
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {/* Mode toggle */}
        <div className="flex h-9 overflow-hidden border border-white/15 text-xs font-medium">
          {(["descendants", "ancestors"] as const).map((m) => (
            <button
              key={m}
              type="button"
              className={`px-3 transition ${
                mode === m
                  ? "bg-terracotta/90 text-white"
                  : "text-sand/60 hover:bg-white/8 hover:text-white"
              }`}
              onClick={() => setMode(m)}
            >
              {m === "descendants" ? "↓ Descendentes" : "↑ Ancestrais"}
            </button>
          ))}
        </div>

        {/* Depth */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-sand/50">Gerações</span>
          {([2, 3, 4, 5] as const).map((d) => (
            <button
              key={d}
              type="button"
              className={`h-9 w-9 border text-sm transition ${
                depth === d
                  ? "border-terracotta bg-terracotta/15 text-white"
                  : "border-white/15 text-sand/60 hover:border-white/30 hover:text-white"
              }`}
              onClick={() => setDepth(d)}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Fit button */}
        <button
          type="button"
          className="h-9 border border-white/15 px-3 text-xs text-sand/60 transition hover:border-white/30 hover:text-white"
          onClick={fitView}
          title="Ajustar à tela"
        >
          ⊡
        </button>

        {/* Stats */}
        <div className="ml-auto hidden text-xs text-sand/35 lg:block">
          {nodes.length} {nodes.length === 1 ? "pessoa" : "pessoas"}
          {rootPerson ? (
            <span className="ml-1 text-sand/50">
              · <span className="text-white/70">{rootPerson.name.split(" ").slice(0, 2).join(" ")}</span>
            </span>
          ) : null}
        </div>
      </div>

      {/* ── Canvas ───────────────────────────────────────────────────────────── */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <svg
          ref={svgRef}
          className="h-full w-full"
          style={{ cursor: isDragging.current ? "grabbing" : "grab", touchAction: "none" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          <defs>
            {nodes.map((n) => (
              <clipPath key={n.id} id={`tc-${n.id}`}>
                <circle cx={0} cy={0} r={NODE_R - 1} />
              </clipPath>
            ))}
          </defs>

          <g transform={`translate(${transform.x},${transform.y}) scale(${transform.scale})`}>

            {/* Links */}
            <g fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={1.5}>
              {links.map((l, i) => (
                <path key={i} d={pathD(l.x1, l.y1, l.x2, l.y2)} />
              ))}
            </g>

            {/* Nodes */}
            {nodes.map((n) => {
              const isRoot     = n.id === rootId;
              const isSel      = n.id === selectedPersonId;
              const stroke     = BRANCH_STROKE[n.person.branch] ?? "#888";
              const fill       = BRANCH_FILL[n.person.branch]   ?? "#1a1a2e";
              const hasPhoto   = !!n.person.photo_url && !failedImages.has(n.id);
              const shortName  = n.person.name.split(" ").filter(Boolean).slice(0, 3).join(" ");
              const yearStr    = n.person.birth_year
                ? `${n.person.birth_year_approx ? "~" : ""}${n.person.birth_year}`
                : "";

              return (
                <g
                  key={n.id}
                  transform={`translate(${n.x},${n.y})`}
                  style={{ cursor: "pointer" }}
                  onClick={(e) => handleNodeClick(n.person, e)}
                  onDoubleClick={(e) => handleNodeDblClick(n.person, e)}
                >
                  {/* Glow ring for root */}
                  {isRoot ? (
                    <circle r={NODE_R + 7} fill="rgba(249,115,22,0.15)" stroke="#f97316" strokeWidth={1.5} />
                  ) : null}
                  {/* Selection ring */}
                  {isSel && !isRoot ? (
                    <circle r={NODE_R + 5} fill="rgba(255,255,255,0.05)" stroke="white" strokeWidth={1.5} opacity={0.6} />
                  ) : null}

                  {/* Background circle */}
                  <circle r={NODE_R} fill={fill} stroke={stroke} strokeWidth={2} />

                  {/* Photo or initials */}
                  {hasPhoto ? (
                    <image
                      href={n.person.photo_url!}
                      x={-(NODE_R - 1)}
                      y={-(NODE_R - 1)}
                      width={(NODE_R - 1) * 2}
                      height={(NODE_R - 1) * 2}
                      clipPath={`url(#tc-${n.id})`}
                      preserveAspectRatio="xMidYMin slice"
                      onError={() => handleImageError(n.id)}
                    />
                  ) : (
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={12}
                      fontWeight="700"
                      fill="rgba(255,255,255,0.85)"
                      style={{ userSelect: "none", pointerEvents: "none" }}
                    >
                      {initials(n.person.name)}
                    </text>
                  )}

                  {/* Name */}
                  <text
                    y={NODE_R + 13}
                    textAnchor="middle"
                    fontSize={10}
                    fontWeight={isRoot ? "700" : "400"}
                    fill="rgba(255,255,255,0.82)"
                    style={{ userSelect: "none", pointerEvents: "none" }}
                  >
                    {shortName}
                  </text>

                  {/* Year */}
                  {yearStr ? (
                    <text
                      y={NODE_R + 24}
                      textAnchor="middle"
                      fontSize={9}
                      fill="rgba(255,255,255,0.38)"
                      style={{ userSelect: "none", pointerEvents: "none" }}
                    >
                      {yearStr}
                    </text>
                  ) : null}
                </g>
              );
            })}
          </g>
        </svg>

        {/* Empty state */}
        {!rootId ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-sand/30">Busque uma pessoa para começar</p>
          </div>
        ) : null}

        {/* Hint */}
        {nodes.length > 0 ? (
          <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs text-sand/25">
            Clique · detalhes &nbsp;&nbsp;·&nbsp;&nbsp; Duplo clique · mudar raiz &nbsp;&nbsp;·&nbsp;&nbsp; Scroll · zoom
          </div>
        ) : null}

        {/* Branch legend */}
        <div className="pointer-events-none absolute bottom-8 right-4 hidden flex-col gap-1.5 lg:flex">
          {(Object.entries(BRANCH_LABEL) as [Branch, string][]).map(([branch, label]) => (
            <div key={branch} className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: BRANCH_STROKE[branch] }}
              />
              <span className="text-xs text-sand/40">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
