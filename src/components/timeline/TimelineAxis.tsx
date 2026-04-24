"use client";

import * as d3 from "d3";
import type { TIMELINE_MARGIN } from "./useTimelineScales";

type SvgSelection = d3.Selection<SVGSVGElement, unknown, null, undefined>;
type Margin = typeof TIMELINE_MARGIN;

export function drawTimelineAxis(
  svg: SvgSelection,
  xScale: d3.ScaleLinear<number, number>,
  height: number,
  margin: Margin,
  width: number,
) {
  const axis = d3
    .axisBottom(xScale)
    .ticks(Math.max(4, Math.floor(width / 120)))
    .tickFormat((value) => String(Math.round(Number(value))));

  const axisGroup = svg
    .append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0, ${height - margin.bottom + 24})`)
    .call(axis);

  axisGroup.selectAll("path, line").attr("stroke", "#475569");
  axisGroup.selectAll("text").attr("fill", "#94a3b8").attr("font-size", 11);

  svg
    .append("line")
    .attr("class", "timeline-baseline")
    .attr("x1", margin.left)
    .attr("x2", width - margin.right)
    .attr("y1", height - margin.bottom)
    .attr("y2", height - margin.bottom)
    .attr("stroke", "#334155")
    .attr("stroke-width", 1);
}
