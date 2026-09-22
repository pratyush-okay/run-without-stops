---
title: "Shortest path versus fewer lights"
seoTitle: "Shortest path versus fewer lights"
description: "Direct draws the shortest pedestrian line through your clicks. Low stops takes longer to avoid lights, and can fall back when a quieter line will not draw."
date: "2026-09-22"
slug: shortest-path-versus-fewer-lights
tags:
  - routing
  - direct
  - low-stops
faqs:
  - question: When should I use Direct instead of Low stops?
    answer: Use Direct when you already know the streets and want the shortest pedestrian line through your clicks. Use Low stops when you want the router to spend time avoiding lights and busy roads.
---

Direct and Low stops are two questions. Direct asks for the shortest pedestrian way through the points you clicked. Lights are allowed. The line still stays on streets and paths a person can use. It does not cut through buildings.

Low stops asks a harder question: prefer streets with fewer lights and less busy road, even when that makes the line longer. That request cannot use the fast prepared graph, so each gap takes more time. The map can show a Direct preview of the new gap while the quieter one is still calculating, then replace it.

Sometimes the quieter request cannot be drawn. The planner then keeps a Direct line and the panel says so. A shorter line than you hoped is often that fallback, or a loop that closed early, not a promise that five kilometres appeared. Read the distance on the metrics before you save it.

R switches the mode without clearing your stops. Avoid hills is only on Low stops. It adds slope to the same slower request. If you already like the streets, stay on Direct. If you are in a new neighborhood and the lights are the problem, switch to Low stops and give the new gaps a moment.
