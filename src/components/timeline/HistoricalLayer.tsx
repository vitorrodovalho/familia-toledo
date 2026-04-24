"use client";

import * as d3 from "d3";
import type { HistoricalEvent } from "@/types/family";

type SvgSelection = d3.Selection<SVGSVGElement, unknown, null, undefined>;

interface TooltipHandlers {
  showTooltip: (event: MouseEvent, text: string) => void;
  hideTooltip: () => void;
}

export function drawHistoricalLayer(
  svg: SvgSelection,
  events: HistoricalEvent[],
  xScale: d3.ScaleLinear<number, number>,
  width: number,
  { showTooltip, hideTooltip }: TooltipHandlers,
) {
  const historicalGroup = svg.append("g").attr("class", "historical-layer");

  historicalGroup
    .append("rect")
    .attr("x", 12)
    .attr("y", 10)
    .attr("width", Math.max(0, width - 24))
    .attr("height", 80)
    .attr("fill", "#1e2d4a")
    .attr("rx", 4);

  historicalGroup
    .append("text")
    .attr("x", 24)
    .attr("y", 30)
    .attr("fill", "#94a3b8")
    .attr("font-size", 11)
    .attr("font-weight", 700)
    .text("HISTÓRIA");

  historicalGroup
    .selectAll<SVGLineElement, HistoricalEvent>(".historical-event")
    .data(events)
    .join("line")
    .attr("class", "historical-event")
    .attr("x1", (event) => xScale(event.year))
    .attr("x2", (event) => xScale(event.year))
    .attr("y1", 34)
    .attr("y2", 82)
    .attr("stroke", (event) => (event.type === "family" ? "#C4703A" : "#64748b"))
    .attr("stroke-width", (event) => (event.type === "family" ? 2 : 1))
    .attr("opacity", 0.85)
    .attr("pointer-events", "stroke")
    .on("mouseover", (pointerEvent, event) => {
      showTooltip(
        pointerEvent,
        `${event.event} (${event.year}) · ${event.region}`,
      );
    })
    .on("mouseout", hideTooltip);
}
