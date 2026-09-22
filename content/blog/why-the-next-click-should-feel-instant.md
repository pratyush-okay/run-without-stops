---
title: "Why the next click should feel instant"
seoTitle: "Why the next map click feels instant"
description: "A new click extends the line on the map. The planner asks only for that street gap, joins it to the stored legs, and paints before the whole run is rebuilt."
date: "2026-09-22"
slug: why-the-next-click-should-feel-instant
tags:
  - routing
  - route-builder
faqs:
  - question: Why does the third click appear before the whole line is recalculated?
    answer: The planner keeps each street gap it already fetched. A new point asks only for the gap from the previous stop, then joins that geometry onto the stored line.
---

A running map feels slow when every click sends the entire line back to the router. The first two points are a short request. The tenth click is the same streets, plus one new corner, packed into one long request. Low stops also turns off the fast prepared graph, so that full request waits even longer.

Run Without Stops keeps one stored leg for each gap between stops. The next click fetches only the new pair and joins it to the prefix already on the map. Distance, time, climb, and major-road meters add up. The shared corner is drawn once. Elevation samples shift forward by the distance of the earlier legs, so the chart still reads as one line.

While Low stops is working, a Direct preview of that same new gap can paint first. The quieter line replaces the last gap when it returns. If the new gap fails, the last good line stays and the error is the one you already see on the panel.

Moving or deleting a stop refetches the one or two gaps that touch it. Switching Direct, Low stops, or Avoid hills refetches every gap in parallel, still as short requests rather than one giant path. Undo hits the cache, because a two-point leg was already stored.

That is the whole speed trick. The router is the same. The request is smaller, and the map does not throw away geometry it already trusted.
