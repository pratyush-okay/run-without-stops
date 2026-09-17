---
title: "How to Use the Run Without Stops Route Builder"
seoTitle: "Direct-path running routes"
description: "Click start and finish on the custom running route map, choose Direct for the literal pedestrian line, then edit waypoints. How to use the Route builder."
date: "2026-09-18"
slug: how-to-use-the-run-without-stops-route-builder
tags:
  - routing
  - route-builder
  - direct
faqs:
  - question: What is a running route builder for direct paths?
    answer: It is the Route builder panel on the map with Direct selected. You drop a start and finish, the line follows legal pedestrian streets between your clicks, and extra parks are not invented to skip lights.
  - question: How do I set a start and finish running route?
    answer: Open the map, click a start or use current location, then click a finish. The panel says Start set. Add a finish after the first point. Search a place if you are not already looking at the streets.
  - question: Is the custom running route map a separate page?
    answer: No. The homepage map is the custom running route map. The Route builder sits on it. Direct and Low stops are switches on the same canvas, not two products.
  - question: When should I stay on Direct instead of Low stops?
    answer: Stay on Direct for a park loop or street you already run. Switch to Low stops when you do not know the lights yet. You can mix both on one saved route.
  - question: Why did Direct still hug a highway?
    answer: Direct still draws a pedestrian line, not a straight line through buildings. Motorways stay expensive, but lights do not. Move a waypoint onto the path you actually run.
howTo:
  name: How to use the Route builder
  anchor: how-to-use-the-route-builder
  steps:
    - name: Open the map
      text: Search a city, zoom until streets appear, or start from where you are. The Route builder sits on that canvas.
    - name: Set a start
      text: Click the map, pick a search result, or use current location. The panel then says Start set. Add a finish.
    - name: Add a finish
      text: One extra click is a point-to-point. Click within about 60 m of the start after two or more points to close a loop.
    - name: Choose Direct
      text: Direct follows your clicks on legal pedestrian streets. Leave Low stops for streets you have not already accepted.
    - name: Edit waypoints
      text: Drag or add a point on a gate or street you trust. Remove a point from the list if it is wrong. The line reroutes.
    - name: Read distance and lights
      text: The panel shows kilometres and a light count once a line exists. Turn layers on if that count still surprises you.
    - name: Export or save
      text: Export GPX, SVG, or an image with no account. Sign in only to save a named line or share a private link.
---

## TL;DR

A running route builder for direct paths is the [best running route planner for fewer stops](/blog/the-complete-guide-to-building-a-run-without-stops) with **Direct** selected: drop a start, drop a finish, keep extra clicks on streets you already trust, then export. Open the [Run Without Stops map](/). The Route builder is the panel on that custom running route map, not a second page.

## What the Route builder is

The Route builder is the control next to the map. Empty, it says click the map, search a place, or start from where you are. After one click it says start set, add a finish. After two points it draws a pedestrian line and shows distance plus a light count.

Direct is the default job of that panel when you already know the line. You are asking for a start and finish running route that respects the order of your clicks. Low stops is the other button, for days you want the same panel to prefer quieter streets. The [low-stop how-to](/blog/how-to-build-low-stop-running-routes-with-run-without-stops) is that sequence. This page is the builder itself: search, location, start, finish, loops, edits, export.

The map is Mapbox. Routing uses GraphHopper’s [foot profile](https://docs.graphhopper.com/#tag/Routing-API), so Direct still follows legal pedestrian geometry. It is not a crow-flies polyline across buildings. If the legal path around a block is longer than the diagonal you imagined, that is the street layout, not a bug.

## Why Direct on a custom running route map

Most “draw a run” tools snap every click to the shortest walk. That is useful when the streets are already yours. It is also how you collect every signal on the shortest legal walk.

Direct on this map is that shorter request, with one extra honesty: motorways and trunks still cost more than a residential street, so the line is less likely to dump you on a shoulder. It will not detour through three extra parks to skip a light. That is Low stops.

Use Direct when the session is a known path. Hyde Park to the water. The Tuesday park loop. A gate you always take. Use it to stitch segments: Low stops from home to the park entry, Direct around the loop, Low stops home on a different street.

The custom running route map is the same homepage for every city. Search a suburb, zoom until streets appear, then click. Overlays and routing load for the viewport. Country-scale zoom will not give you lights you can trust.

## How to use the Route builder

1. Open the [map](/). Search a city, zoom until streets appear, or start from where you are. The camera still opens on Sydney if the browser has no location yet.
2. Set a start. Click the map, pick a search result, or use **Use my location**. Reverse-geocoded labels show in the point list when a name exists.
3. Add a finish. One extra click is a point-to-point start and finish running route. The line appears after the second point.
4. Choose **Direct**. Leave **Low stops** for streets you have not already accepted. **Avoid hills** only appears when Low stops is on.
5. Add waypoints in the order you will run them. A park gate, a fountain, a street behind an arterial. Direct will not notice a pretty gate you did not click.
6. Close a loop by clicking near the start after you already have two or more points. The snap is about 60 m. Dragging the finish onto the start does the same thing.
7. Read the panel: distance and how many lights sit on the line. Turn on **traffic lights**, **highways**, and **busy roads** if that number still feels wrong. The [traffic-lights note](/blog/a-runners-guide-to-traffic-lights-crossings-and-route-intelligence) is how those marks differ.
8. Edit. Drag a point. Add a click on the street you meant. Remove a row from the list. Duplicate clicks closer than about 2 m are ignored. The cap is 50 stops.
9. Export GPX, SVG, or an image with no account. Sign in only to save a named line or share a `/r/` link. Those share URLs stay out of search.

That is the builder. The intelligence is the clicks plus the layers, not a hidden score.

## Start, finish, and the line between them

A start and finish running route is two clicks. Everything else is a constraint you chose.

Search biases toward the map you are looking at. Type a park, a suburb, a city. If nothing useful comes back, try a more specific name, then zoom to streets before you trust overlays. A search result can be the start, the finish, or a waypoint in the middle. Click it in the order you will run it.

Current location is a start, not a route. You still need a finish. If the browser blocks location, search or click. On a phone, open the Route builder panel to see Direct, the point list, and export; the collapsed chip only shows that a line exists.

Direct still mildly avoids motorways and trunks. It does not treat a traffic-light cluster as a reason to leave the street. If the first Direct line hugs a highway because the fence is short, put a point on the residential parallel you can actually run. If it cuts a corner you never take, put a point on the gate.

Closing a loop on the same arterial you arrived on doubles the signals. Finish on a different street, or leave it as a point-to-point and walk the last block you already accept.

Mix modes on one saved route when the session has two jobs. Direct for the known loop. Low stops for the commute to the gate. Save it under a name you will recognise at 6 a.m.

## What the panel is telling you

You are looking at one canvas. Direct is a switch on that canvas.

- **Start set. Add a finish.** You have one point. The line waits for the second click.
- **Finding your line…** GraphHopper is calculating the foot path.
- **Distance · N lights** is the review. Distance is the pedestrian geometry. Lights are OSM `highway=traffic_signals` near the line ([OSM wiki, traffic signals](https://wiki.openstreetmap.org/wiki/Tag:highway=traffic_signals)). They are not a live countdown.
- **Avoid hills** stays hidden on Direct. Flatten a known corridor only after you switch to Low stops, or accept the profile Direct already drew.

Parks, crossings, and drinking water help once the bones of the line look right. A fountain on the line is a reason to keep a click on a warm morning. A missing OSM path is a path the router cannot use. Treat the layers as the current map, then move a waypoint when the street in front of you disagrees.

Export is GPX, SVG, or PNG. Save and share wait until you sign in.

## Common mistakes

1. **Leaving Direct on for a suburb you do not know.** Direct looks tidy because it ignored the lights. You meet them later. Switch to [Low stops](/blog/how-to-build-low-stop-running-routes-with-run-without-stops) until the streets are yours.
2. **Two clicks 12 km apart with no park or gate waypoint.** Direct follows legal geometry. It may not pick your park.
3. **Closing the loop on the arrival arterial.** You just ran the same lights twice.
4. **Hiding the traffic-light layer after the line appears.** The panel light count is a hint. The marks are the evidence.
5. **Expecting Avoid hills on Direct.** That switch lives under Low stops.
6. **Treating Direct as a straight line.** Buildings, one-way footpaths, and fences still win.
7. **Expecting overlays for a whole country.** Zoom to the streets you will run.

## FAQs

### What is a running route builder for direct paths?

It is the Route builder panel on the map with Direct selected. You drop a start and finish. The line follows legal pedestrian streets between your clicks. Extra parks are not invented to skip lights.

### How do I set a start and finish running route?

Open the [map](/), click a start or use current location, then click a finish. After the first point the panel says start set, add a finish. Search a place if you are not already looking at the streets.

### Is the custom running route map a separate page?

No. The homepage is the custom running route map. Direct and Low stops are switches on that canvas. Notes live under [quieter route notes](/blog). Shared `/r/` links stay out of search.

### When should I stay on Direct instead of Low stops?

Stay on Direct for a park loop or street you already run. Switch to Low stops when you do not know the lights yet. Mix both on one saved route when the session has both jobs.

### Why did Direct still hug a highway?

Direct still draws a pedestrian line. Motorways cost more than a back street, but a short fence can still win. Move a waypoint onto the path you actually run, then read the [complete guide](/blog/the-complete-guide-to-building-a-run-without-stops) if you also need hills, water, save, and share.

Open the [map](/), drop two points on a loop you already run, leave Direct on, and watch the line follow the clicks. If it still cuts a corner you never take, move a point. If the job is a calmer profile rather than a known loop, read [flat running routes vs Direct](/blog/flat-running-routes-vs-direct-routes-which-is-right-for-your-run).
