"use client";

import * as d3 from "d3";
import type { Branch, TimelineEvent } from "@/types/family";

type SvgSelection = d3.Selection<SVGSVGElement, unknown, null, undefined>;

interface TooltipHandlers {
  showTooltip: (event: MouseEvent, text: string) => void;
  hideTooltip: () => void;
}

const BRANCH_COLORS: Record<Branch, string> = {
  toledo_espanha: "#3b82f6",
  rodovalho: "#22c55e",
  toledo_pisa: "#a855f7",
  toledo_rodovalho: "#C4703A",
};

const EVENT_COLORS: Record<TimelineEvent["type"], string> = {
  birth: "#22c55e",
  death: "#94a3b8",
};

function formatEventType(event: TimelineEvent): string {
  return event.type === "birth" ? "Nascimento" : "Falecimento";
}

function formatTooltip(event: TimelineEvent): string {
  const place = event.place ? `, ${event.place}` : "";
  return `${event.person_name} — ${formatEventType(event)} ${event.year}${place}`;
}

export function drawFamilyEventLayer(
  svg: SvgSelection,
  events: TimelineEvent[],
  xScale: d3.ScaleLinear<number, number>,
  yScale: d3.ScaleLinear<number, number>,
  onSelect: (id: string) => void,
  { showTooltip, hideTooltip }: TooltipHandlers,
) {
  const [rangeStart = 0, rangeEnd = 0] = xScale.range();

  svg
    .append("g")
    .attr("class", "generation-grid")
    .selectAll("line")
    .data(d3.range(1, 16))
    .join("line")
    .attr("x1", rangeStart)
    .attr("x2", rangeEnd)
    .attr("y1", (generation) => yScale(generation))
    .attr("y2", (generation) => yScale(generation))
    .attr("stroke", "#1e293b")
    .attr("stroke-width", 1);

  svg
    .append("g")
    .attr("class", "family-event-layer")
    .selectAll<SVGCircleElement, TimelineEvent>(".timeline-event")
    .data(events)
    .join("circle")
    .attr("class", "timeline-event")
    .attr("cx", (event) => xScale(event.year))
    .attr("cy", (event) => yScale(event.generation ?? 8))
    .attr("r", 3)
    .attr("fill", (event) => EVENT_COLORS[event.type])
    .attr("stroke", (event) => BRANCH_COLORS[event.branch] ?? "#ffffff")
    .attr("stroke-width", 0.7)
    .attr("opacity", (event) => (event.type === "birth" ? 0.9 : 0.4))
    .attr("cursor", "pointer")
    .on("mouseover", function handleMouseOver(pointerEvent, event) {
      d3.select(this).attr("r", 6).attr("opacity", 1);
      showTooltip(pointerEvent, formatTooltip(event));
    })
    .on("mouseout", function handleMouseOut(_, event) {
      d3.select(this).attr("r", 3).attr("opacity", event.type === "birth" ? 0.9 : 0.4);
      hideTooltip();
    })
    .on("click", (_, event) => onSelect(event.person_id));
}
