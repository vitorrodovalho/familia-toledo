"use client";

import { useMemo } from "react";
import * as d3 from "d3";

export const TIMELINE_HEIGHT = 560;
export const TIMELINE_MARGIN = {
  top: 40,
  right: 40,
  bottom: 70,
  left: 60,
};

export interface TimelineScales {
  xScale: d3.ScaleLinear<number, number>;
  yScale: d3.ScaleLinear<number, number>;
}

export function useTimelineScales(width: number): TimelineScales {
  return useMemo(() => {
    const safeWidth = Math.max(width, 320);

    return {
      xScale: d3
        .scaleLinear()
        .domain([1466, 2025])
        .range([TIMELINE_MARGIN.left, safeWidth - TIMELINE_MARGIN.right]),
      yScale: d3
        .scaleLinear()
        .domain([1, 15])
        .range([180, TIMELINE_HEIGHT - TIMELINE_MARGIN.bottom]),
    };
  }, [width]);
}
