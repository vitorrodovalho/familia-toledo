declare module "d3-force-3d" {
  export interface SimulationNodeDatum {
    index?: number;
    x?: number;
    y?: number;
    z?: number;
    vx?: number;
    vy?: number;
    vz?: number;
    fx?: number | null;
    fy?: number | null;
    fz?: number | null;
  }

  export interface SimulationLinkDatum<NodeDatum extends SimulationNodeDatum> {
    source: string | number | NodeDatum;
    target: string | number | NodeDatum;
    index?: number;
  }

  export interface Simulation<NodeDatum extends SimulationNodeDatum> {
    tick(iterations?: number): this;
    stop(): this;
    force(name: string): Force<NodeDatum> | undefined;
    force(name: string, force: Force<NodeDatum> | null): this;
  }

  export interface Force<NodeDatum extends SimulationNodeDatum> {
    (alpha: number): void;
    initialize?: (nodes: NodeDatum[], random?: () => number, nDim?: number) => void;
  }

  export interface ForceLink<
    NodeDatum extends SimulationNodeDatum,
    LinkDatum extends SimulationLinkDatum<NodeDatum>,
  > extends Force<NodeDatum> {
    id(): (node: NodeDatum, index: number, nodes: NodeDatum[]) => string;
    id(id: (node: NodeDatum, index: number, nodes: NodeDatum[]) => string): this;
    distance(): (link: LinkDatum, index: number, links: LinkDatum[]) => number;
    distance(
      distance: number | ((link: LinkDatum, index: number, links: LinkDatum[]) => number),
    ): this;
  }

  export interface ForceManyBody<NodeDatum extends SimulationNodeDatum>
    extends Force<NodeDatum> {
    strength(): (node: NodeDatum, index: number, nodes: NodeDatum[]) => number;
    strength(
      strength:
        | number
        | ((node: NodeDatum, index: number, nodes: NodeDatum[]) => number),
    ): this;
  }

  export function forceSimulation<NodeDatum extends SimulationNodeDatum>(
    nodes?: NodeDatum[],
    nDim?: number,
  ): Simulation<NodeDatum>;

  export function forceLink<
    NodeDatum extends SimulationNodeDatum,
    LinkDatum extends SimulationLinkDatum<NodeDatum>,
  >(
    links?: LinkDatum[],
  ): ForceLink<NodeDatum, LinkDatum>;

  export function forceManyBody<
    NodeDatum extends SimulationNodeDatum,
  >(): ForceManyBody<NodeDatum>;

  export function forceCenter<NodeDatum extends SimulationNodeDatum>(
    x?: number,
    y?: number,
    z?: number,
  ): Force<NodeDatum>;
}
