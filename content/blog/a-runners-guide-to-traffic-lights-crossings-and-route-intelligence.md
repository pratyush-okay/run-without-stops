---
title: "A Runner's Guide to Traffic Lights, Crossings, and Route Intelligence"
seoTitle: "Traffic light avoidance for runs"
description: "See traffic lights, crossings, and busy roads on the same map you draw, then pull the line off the worst waits. OSM marks, low-stop routing, and a checklist."
date: "2026-09-17"
slug: a-runners-guide-to-traffic-lights-crossings-and-route-intelligence
tags:
  - traffic-lights
  - crossings
  - routing
faqs:
  - question: Does avoiding traffic lights on a running route skip every signal?
    answer: No. Low-stop routing prefers streets with fewer signals. Remaining marks on the line are real waits. Move a waypoint or accept the crossing you have.
  - question: What is the difference between a traffic light and a crossing on the map?
    answer: A traffic-light mark is a signal in OpenStreetMap. A crossing mark is where pedestrians are meant to get over the road. Some crossings are signalised; some are zebras or refuges with no light.
  - question: How do I avoid busy roads when planning a run?
    answer: Turn on the busy-road and highway layers, choose low-stop, then slide a waypoint onto a parallel street or park edge if the first line still hugs the arterial.
  - question: Why is a traffic light missing from the running map?
    answer: The marks come from OpenStreetMap for the streets on screen. A missing light usually means OSM has not tagged it yet, or you are zoomed too far out for overlays to load.
  - question: Does running route traffic light avoidance work outside Sydney?
    answer: Yes. Search a city, zoom to streets, or start from where you are. Lights, crossings, and routing load for the viewport, not for a whole country at once.
---

## TL;DR

Running route traffic light avoidance is reading signal and crossing marks on the map, then asking the router for a quieter pedestrian line. On the [best running route planner for fewer stops](/blog/the-complete-guide-to-building-a-run-without-stops) that means low-stop mode plus the traffic-light, crossing, highway, and busy-road layers. The marks are OpenStreetMap, not a live countdown.

## What is running route traffic light avoidance?

It is planning so the reds you hit are fewer, and the ones you keep are the ones you chose. A shortest-path walking line still sends you through every signal that sits on the shortest legal path. Avoidance is the extra request: prefer a residential parallel, a park gate, or a longer block if that geometry has fewer lights.

On [Run Without Stops](/) the request is **low-stop**. Direct mode still draws the more literal pedestrian line between your clicks. You can use both on one saved route: low-stop through the grid, direct around a park loop you already know.

The map also shows **crossings**. A crossing is not the same object as a light. OpenStreetMap tags vehicle signals as `highway=traffic_signals` and signalised pedestrian crossings as `crossing=traffic_signals` ([OSM wiki, traffic signals](https://wiki.openstreetmap.org/wiki/Tag:highway=traffic_signals), [OSM wiki, crossing=traffic_signals](https://wiki.openstreetmap.org/wiki/Tag:crossing%3Dtraffic_signals)). Taginfo on that crossing tag lists about 2.5 million uses worldwide. The layer is a density map of mapped objects, not a promise that every pole in the street is drawn.

Busy-road avoidance sits next to lights. A green light on a pinched arterial is still a chopped run: buses, driveways, a footpath that disappears at the corner. Highways are the next step up. Low-stop tries to keep off both when a quieter legal alternative exists.

## Why traffic light avoidance matters on a run

An 8 km line with six lights is not the same session as 8 km along a park edge. The watch includes the wait. Pace becomes a story you tell after you subtract the reds, which you never actually subtract.

Lights cluster. A corridor with a mark every block is a reason to pull the line one street over even if that street is 200 m longer. A single remaining mark at a six-lane road may be the only legal way across. Avoidance is counting those marks on the proposed line, then deciding which ones you will keep.

Crossings change the count. A refuge on a quiet street can be the thing that makes a low-stop line usable. A signalised crossing on a six-lane road is still a stop. Leave both layers on until you have walked the line once, or until you already know that corner.

If you only hide the light layer after the line appears, you are reviewing a drawing, not the evidence. The [complete guide to building a run without stops](/blog/the-complete-guide-to-building-a-run-without-stops) treats the layers as the intelligence. This note is the same idea aimed at lights, crossings, and busy roads only.

Overlays load when the map is zoomed into streets, not at country scale. Search Tokyo or London, then zoom until you can see blocks. Country zoom will not give you a trustworthy light layer.

## How to read lights, crossings, and busy roads

1. Open the [map](/). Search a place or zoom until the streets you will run are visible.
2. Set a start. Click, pick a search result, or use your location. The camera still opens on Sydney when the browser has no location. That is a default, not a coverage limit.
3. Add a finish. Extra clicks belong on park gates, water, or a street you already trust.
4. Choose **low-stop** unless you already know the exact path.
5. Turn on **traffic lights**, **crossings**, **highways**, and **busy roads**.
6. Count the light marks that sit on the proposed line. A cluster along one corridor is the first place to move a waypoint.
7. Check crossings on the same stretch. A zebra on a quiet street can replace a signalised arterial if the gate exists. A crossing on a highway-scale road is still a wait.
8. If the line hugs a highway or a busy road, slide a point onto the parallel grid or the park edge and let it reroute.
9. Zoom out only to jump cities. Zoom back in before you trust the marks.

That checklist is the whole method. There is no hidden score. If a light is missing in the street and missing on the map, OSM may not have it yet. Treat the layers as the current map, then adjust when the kerb in front of you disagrees.

### What each mark actually is

| Layer | What the mark means | What it does not mean |
| --- | --- | --- |
| Traffic lights | A signal tagged in OSM for this viewport | The next phase, a countdown, or every unmapped pole |
| Crossings | Where pedestrians are meant to get over the road | That the crossing is signalised, or that it is safe at 6 a.m. |
| Highways | A corridor you usually want the line to refuse | A legal ban on every nearby footpath |
| Busy roads | Loud, pinched streets one tier down from highways | That the light is red |

Crossings and lights overlap at many junctions. You can see a light and a crossing on the same corner. That is one wait, drawn as two objects. Count the wait once.

### A short worked example

Say you draw home to a park 4 km away. The first low-stop line still clips three lights on the same arterial. Turn the light layer on and you will see the cluster. Put a waypoint one block behind that arterial, on the grid, and generate again. You often drop two of the three waits and keep the one mark that is the only way across the big road at the park gate.

If the park has a second gate, put the finish on that gate instead of the first driveway you clicked. Crossings at park edges are how you skip a block of signals without inventing a path through private land.

Close a loop only if you want to finish where you started. Closing on the same arterial you arrived on doubles the signals.

## Tools for traffic light avoidance

Run Without Stops is the tool this site ships: a free map, worldwide search, OSM overlays, low-stop and direct routing, optional save and share. Sign-in is only for save and share.

Other planners solve adjacent jobs. [Trail Router](https://trailrouter.com/) prefers parks, water, and (in one setting) lit streets, and it can avoid busy roads; it does not advertise a traffic-light layer. Loop generators such as MapPlanner and Runplanner snap to paths and quiet streets. A GitHub project, [RunPaths](https://github.com/rubentalstra/runpaths), generates circular loops with a traffic-light avoidance slider. Use those if you want a distance loop from one pin. Use Run Without Stops when you want to see the lights on the same canvas you click, then pull the line yourself.

Do not expect any of these maps to know the current phase. OSM has optional tags such as `button_operated=*` for pedestrian call buttons. The Run Without Stops layer does not turn those into a live walk/don't-walk state.

## Common mistakes

1. **Choosing direct because the line looks cleaner.** Direct ignored the lights. You still meet them.
2. **Hiding the traffic-light layer after the line draws.** The line is a proposal. The marks are the evidence.
3. **Treating every crossing as a free pass.** A signalised six-lane crossing is a stop. A refuge on a quiet street may not be.
4. **Trusting overlays at country zoom.** Lights load for the streets on screen. Zoom in.
5. **Repeating the arrival arterial on the way home.** You collect the same cluster twice.
6. **Assuming a missing mark means a missing pole.** OSM tagging is incomplete in a lot of grids. If the street in front of you has a signal and the map does not, move the waypoint as if the mark were there, then add the object to OSM later if you map.

## FAQs

### Does avoiding traffic lights on a running route skip every signal?

No. Low-stop prefers streets with fewer signals and keeps off highways and busy roads when a quieter alternative exists. Remaining marks on the line are real waits. Slide a waypoint or accept the crossing.

### What is the difference between a traffic light and a crossing on the map?

A traffic-light mark is a signal in OpenStreetMap. A crossing mark is where pedestrians are meant to get over the road. Some crossings are tagged `crossing=traffic_signals`. Some are zebras or refuges with no light. Count waits, not icons.

### How do I avoid busy roads when planning a run?

Turn on busy roads and highways, choose low-stop, and read the line against those marks. If it still hugs the arterial, put a waypoint on a parallel street or park edge and reroute. Flat plus a highway shoulder is still a bad run.

### Why is a traffic light missing from the running map?

Overlays are OSM data for the current viewport. A gap is usually an untagged signal, or a zoom level too wide for layers to load. Zoom to streets, then treat a pole you can see as a wait even if the mark is late.

### Does running route traffic light avoidance work outside Sydney?

Yes. Search a city, zoom the map, or start from where you are. Lights, crossings, and routing load for those streets. Sydney is only the default camera when the browser has no location.

Open the [map](/), drop two points in a neighbourhood you actually run, and leave the traffic-light and crossing layers on while the line draws. If the line still looks like a bus route, move a point. For the click sequence that builds a low-stop line, read [how to build low-stop running routes](/blog/how-to-build-low-stop-running-routes-with-run-without-stops). For the rest of the planner (hills, water, save, share), stay on the [best running route planner for fewer stops](/blog/the-complete-guide-to-building-a-run-without-stops).
