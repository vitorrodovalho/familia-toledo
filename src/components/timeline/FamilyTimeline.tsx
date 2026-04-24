"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useFamilyStore } from "@/store/familyStore";
import type { HistoricalEvent, Person, TimelineEvent } from "@/types/family";
import { drawFamilyEventLayer } from "./FamilyEventLayer";
import { drawHistoricalLayer } from "./HistoricalLayer";
import { drawTimelineAxis } from "./TimelineAxis";
import { drawTimelineBrush } from "./TimelineBrush";
import {
  TIMELINE_HEIGHT,
  TIMELINE_MARGIN,
  useTimelineScales,
} from "./useTimelineScales";

interface FamilyTimelineProps {
  events: TimelineEvent[];
  historicalEvents: HistoricalEvent[];
  persons: Person[];
  resetSignal?: number;
}

type SvgSelection = d3.Selection<SVGSVGElement, unknown, null, undefined>;

function showTooltip(event: MouseEvent, text: string) {
  const tooltip = document.getElementById("timeline-tooltip");
  if (!tooltip) {
    return;
  }

  tooltip.textContent = text;
  tooltip.style.display = "block";
  tooltip.style.left = `${event.pageX + 12}px`;
  tooltip.style.top = `${event.pageY - 28}px`;
}

function hideTooltip() {
  const tooltip = document.getElementById("timeline-tooltip");
  if (tooltip) {
    tooltip.style.display = "none";
  }
}

function drawGenerationLabels(
  svg: SvgSelection,
  yScale: d3.ScaleLinear<number, number>,
) {
  svg
    .append("g")
    .attr("class", "generation-labels")
    .selectAll("text")
    .data([1, 3, 5, 7, 9, 11, 13, 15])
    .join("text")
    .attr("x", 18)
    .attr("y", (generation) => yScale(generation) + 4)
    .attr("fill", "#64748b")
    .attr("font-size", 10)
    .text((generation) => `${generation}ª`);
}

export function FamilyTimeline({
  events,
  historicalEvents,
  resetSignal = 0,
}: FamilyTimelineProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [width, setWidth] = useState(960);
  const activeBranches = useFamilyStore((state) => state.activeBranches);
  const setSelectedPerson = useFamilyStore((state) => state.setSelectedPerson);
  const { xScale, yScale } = useTimelineScales(width);

  useEffect(() => {
    if (!svgRef.current) {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      const nextWidth = Math.floor(entry?.contentRect.width ?? 0);
      if (nextWidth > 0) {
        setWidth(nextWidth);
      }
    });

    observer.observe(svgRef.current);
    return () => observer.disconnect();
  }, []);

  const drawTimeline = useCallback(() => {
    if (!svgRef.current) {
      return;
    }

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${width} ${TIMELINE_HEIGHT}`);

    const filteredEvents = events.filter((event) => activeBranches.has(event.branch));
    const tooltipHandlers = { showTooltip, hideTooltip };

    drawHistoricalLayer(svg, historicalEvents, xScale, width, tooltipHandlers);
    drawGenerationLabels(svg, yScale);
    drawFamilyEventLayer(
      svg,
      filteredEvents,
      xScale,
      yScale,
      setSelectedPerson,
      tooltipHandlers,
    );
    drawTimelineAxis(svg, xScale, TIMELINE_HEIGHT, TIMELINE_MARGIN, width);
    drawTimelineBrush(svg, xScale, TIMELINE_HEIGHT, TIMELINE_MARGIN);

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 20])
      .translateExtent([
        [TIMELINE_MARGIN.left, 0],
        [width - TIMELINE_MARGIN.right, TIMELINE_HEIGHT],
      ])
      .on("zoom", (zoomEvent) => {
        const nextX = zoomEvent.transform.rescaleX(xScale);

        svg
          .selectAll<SVGCircleElement, TimelineEvent>(".timeline-event")
          .attr("cx", (event) => nextX(event.year));
        svg
          .selectAll<SVGLineElement, HistoricalEvent>(".historical-event")
          .attr("x1", (event) => nextX(event.year))
          .attr("x2", (event) => nextX(event.year));
        svg.select<SVGGElement>(".x-axis").call(
          d3
            .axisBottom(nextX)
            .ticks(Math.max(4, Math.floor(width / 120)))
            .tickFormat((value) => String(Math.round(Number(value)))),
        );
        svg.selectAll(".x-axis path, .x-axis line").attr("stroke", "#475569");
        svg.selectAll(".x-axis text").attr("fill", "#94a3b8").attr("font-size", 11);
      });

    svg.call(zoom);

    if (resetSignal > 0) {
      svg.call(zoom.transform, d3.zoomIdentity);
    }
  }, [
    activeBranches,
    events,
    historicalEvents,
    resetSignal,
    setSelectedPerson,
    width,
    xScale,
    yScale,
  ]);

  useEffect(() => {
    drawTimeline();
  }, [drawTimeline]);

  return (
    <svg
      ref={svgRef}
      className="block w-full touch-none border-y border-slate-800"
      style={{ height: TIMELINE_HEIGHT, background: "#0D1526" }}
      role="img"
      aria-label="Linha do tempo da família Toledo Rodovalho"
    />
  );
}
