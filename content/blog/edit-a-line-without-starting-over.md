---
title: "Edit a line without starting over"
seoTitle: "Edit a line without starting over"
description: "Drag a stop to move it, drag the route stroke to insert a waypoint, and shift-click a stop to remove it. Only the gaps that touch the edit are fetched again."
date: "2026-09-22"
slug: edit-a-line-without-starting-over
tags:
  - route-builder
  - waypoints
faqs:
  - question: How do I add a stop in the middle of a route?
    answer: Drag the route line, not a stop marker, and release. The new waypoint lands between the two stops that own that stretch, and those two gaps are fetched again.
---

A line is a list of stops. You do not have to clear it to change one corner.

Drag a stop marker and release it on the street you want. The gaps on either side of that stop are the ones that change, so those are the ones fetched again. The rest of the line stays.

Drag the route stroke itself when the corner you want is between two stops and neither marker is in the right place. On release, a new waypoint is inserted on that stretch. Shift-click a stop to remove it. Delete removes the last point. Z undoes an add.

Clicking near the start after two or more points still closes a loop. The closing gap is just another leg, from the last stop back to the start. Opening the loop again is an undo or a delete of that closing point.

Save when the line is the one you will run. Until then, edit. The map keeps the stops, and only the gaps you touched go back to the router.
