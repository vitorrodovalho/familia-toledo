"use client";

import * as d3 from "d3";
import type { TIMELINE_MARGIN } from "./useTimelineScales";

type SvgSelection = d3.Selection<SVGSVGElement, unknown, null, undefined>;
type Margin = typeof TIMELINE_MARGIN;

export function drawTimelineBrush(
  svg: SvgSelection,
  xScale: d3.ScaleLinear<number, number>,
  height: number,
  margin: Margin,
  onBrush?: (range: [number, number] | null) => void,
) {
  const [, rangeEnd = margin.left] = xScale.range();
  const brush = d3
    .brushX<unknown>()
    .extent([
      [margin.left, height - 34],
      [rangeEnd, height - 12],
    ])
    .on("brush end", (event) => {
      if (!event.selection) {
        onBrush?.(null);
        return;
      }

      const [start, end] = event.selection as [number, number];
      onBrush?.([xScale.invert(start), xScale.invert(end)]);
    });

  const brushGroup = svg.append("g").attr("class", "timeline-brush").call(brush);
  brushGroup.selectAll(".overlay").attr("fill", "transparent");
  brushGroup.selectAll(".selection").attr("fill", "#C4703A").attr("opacity", 0.18);
  brushGroup.selectAll(".handle").attr("fill", "#C4703A");
}
