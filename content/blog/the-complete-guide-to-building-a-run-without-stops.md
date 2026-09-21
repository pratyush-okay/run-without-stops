---
title: "The Complete Guide to Building a Run Without Stops"
seoTitle: "Fewer-stop running route planner"
description: "Plan a run with fewer traffic lights, highways, and busy streets. How low-stop routing, hill avoidance, and map layers work in Run Without Stops. Open the map."
date: "2026-09-18"
slug: the-complete-guide-to-building-a-run-without-stops
tags:
  - routing
  - sydney
  - traffic-lights
faqs:
  - question: What is the best running route planner for fewer stops?
    answer: A planner that can see traffic lights, highways, and busy roads on the same map you draw, then build a pedestrian line that skips them when you ask. Run Without Stops does that worldwide, for free.
  - question: How do I plan a nonstop running route in Sydney?
    answer: Open the map, drop a start, add a finish, choose low-stop, and check the traffic-light and busy-road layers before you go. Add more clicks if the first line still clips a junction you hate.
  - question: Does low-stop routing avoid every traffic light?
    answer: No. It prefers streets with fewer signals and busy roads. You still read the layer marks and move a waypoint if a remaining light sits on a corner you cannot skip.
  - question: When should I use the direct route builder?
    answer: Use direct when the shortest legal pedestrian line is the point, such as a known path through a park. Use low-stop when red lights and highways would chop the same distance into waits.
  - question: Can I flatten hills on a planned run?
    answer: Choose Low stops, then turn Avoid hills on before you route. The line will trade some extra metres for less climbing. Confirm the result on the elevation marks, then move a point if a remaining climb is still too steep.
  - question: Does Run Without Stops work outside Sydney?
    answer: Yes. Search a city, zoom the map, or start from where you are. Lights, crossings, and routing load for the streets you are looking at.
---

A run without stops is a pedestrian line you can keep moving on: fewer red lights, fewer highway edges, fewer busy-road squeezes. The [Run Without Stops map](/) lets you click a start, search a place, and ask for a low-stop line instead of the shortest path across every signal.

## What is a run without stops?

A run without stops is a route that treats waiting as part of the distance. The clock on your watch includes the minute you spend at a pedestrian crossing on Anzac Parade. A map that only minimises metres will still send you through those lights if they sit on the shortest legal path.

Run Without Stops is a free, map-first planner. You click the map, search a place, or start from where you are. The map still opens on Sydney if the browser has no location yet. Low-stop mode asks the router to prefer streets with fewer traffic lights and to keep off highways and busy roads when a quieter alternative exists. Direct mode draws the more literal pedestrian line. Avoid hills is a separate switch, and it only appears after Low stops is selected.

The product name is literal. The job is not a training plan, a race predictor, or a social feed. It is a line on a dark map that you can follow without collecting a string of reds.

## Low-stop routes vs direct routes vs generic maps

Most people already have a map app. The difference is what the line is allowed to ignore.

| Planner | What it optimises | What you see on the map | When to use it |
| --- | --- | --- | --- |
| Phone walking directions | Shortest or fastest legal walk | Roads, sometimes crossings | Getting somewhere once |
| Running heatmaps | Where other people have gone | Density, not lights | Finding a popular loop |
| Run Without Stops, direct | Pedestrian line between your clicks | Your points, plus optional layers | Known park paths, short links |
| Run Without Stops, low-stop | Pedestrian line that can skip lights, highways, and busy roads | Traffic lights, crossings, highways, busy roads, parks, water | The weekday run you want to keep moving on |

Direct is the closest thing to “draw this.” Low-stop is the closest thing to “draw this, but do not make me stand at the light.” Neither replaces looking at the layer marks. A quieter street can still hold one signal at a nasty corner.

A heatmap will show you that people run around Centennial Park. It will not tell you whether your commute-to-the-park segment crosses a highway ramp. Turn the highway and busy-road layers on before you trust a pretty loop.

## Why fewer stops change the run

An 8 km line that crosses six lights is not the same run as 8 km along a park edge. The first one fragments. You start, you stop, you start again. Pace becomes a story you tell after you subtract the waits, which you never actually subtract.

Busy roads add a second cost. Even when the light is green, you are sharing a pinched footpath, turning your head for buses, and taking the corner wide. Highways are worse: the legal pedestrian option may be a shoulder, an overpass, or a long detour the shortest-path engine still likes because the geometry is clean.

Traffic lights, crossings, parks, and drinking water are on the map as layers because they are the objects that decide whether a Sydney line feels like a run or a sequence of intersections. You can hide parks if you already know the green. You should leave lights visible until you have walked the line once.

Hill avoidance is the same idea on the vertical axis. A “flat” looking street in the inner west can still climb. Avoid hills asks the router to spend extra distance to keep the profile calmer. It will not erase every rise in Sydney sandstone. It will stop the line from treating a short steep pinch as free.

## How to plan a nonstop running route

![Run Without Stops Route builder on Low stops over the Sydney Harbour map, Avoid hills Off](/screenshots/homepage-hero.jpg)

1. Open the [map](/). Search a city or zoom until you can see the streets you want.
2. Set a start. Click the map, pick a search result, or use your location.
3. Add a finish. One more click is enough for a point-to-point. Add extra clicks if you need a park gate, a water fountain, or a street you already trust.
4. Choose **low-stop** unless you already know the exact path and want **direct**.
5. If the run should stay flatter, turn on **Avoid hills** before the line comes back. It only appears under Low stops.
6. Turn on **traffic lights**, **highways**, and **busy roads**. Parks, crossings, and water help once the bones of the line look right.
7. Read the line against those marks. If it still clips a junction you hate, drag or add a waypoint around it and let it reroute.
8. Close the loop only if you actually want to finish where you started. Closing a loop through the same arterial twice is how you collect the same lights again.
9. Save if you want the line later. Share if someone else needs the URL. Sign-in is optional until you do either of those.

For the click-by-click low-stop build, including what to do when the first draft still holds three lights, read [how to build low-stop running routes](/blog/how-to-build-low-stop-running-routes-with-run-without-stops).

That is the whole loop. The intelligence is in the layers plus the router, not in a hidden coaching model.

## How running routes with fewer traffic lights work

Low-stop routing still has to follow pedestrian-legal geometry. It cannot jump a freeway. It can prefer a residential street that parallels a signalised road, or a park path that exits onto a quieter crossing.

The traffic-light layer is OSM data, not a live countdown. A mark means there is a signal in the map. It does not mean the next phase is 12 seconds. Use it as a density map: a cluster of lights along a corridor is a reason to pull the line one block over, even if that block is slightly longer.

Crossings are a different object. Some are signals. Some are zebra crossings or refuges. A crossing on a quiet street can be the thing that makes a low-stop line usable. A crossing on a six-lane road can still be a stop. Leave the crossing layer on when you are choosing which park gate to exit.

If the first low-stop line still threads three lights in a kilometre, you are not looking at a bug so much as a neighbourhood that is built that way. Centennial Park or the coast will forgive you. A Parramatta Road parallel will not. Move a waypoint into the grid behind the arterial and generate again.

For a tighter pass on lights, crossings, and busy-road marks, read [A Runner's Guide to Traffic Lights, Crossings, and Route Intelligence](/blog/a-runners-guide-to-traffic-lights-crossings-and-route-intelligence).

## Using running route hill avoidance

Avoid hills is a constraint, not a promise of pancake-flat kilometres. Sydney has ridges. The option tells the router that climbing has a cost, so a longer flatter street can win.

Turn it on before you route, then read the elevation marks on the line. If a climb still sits on a section you care about, add a waypoint on the lower street you actually want. The router cannot guess that you would rather run an extra 400 m than take the pinch up to the ridge.

Use it with Low stops, not as a substitute. A flat highway shoulder is still a bad run. Flat plus lights plus buses is still a chopped run. The useful combination in most inner suburbs is Low stops on, Avoid hills on, lights and busy roads visible.

Avoid hills only appears when Low stops is selected. Direct does not show that switch. For when a flatter line is the better request than Direct, read [flat running routes vs Direct](/blog/flat-running-routes-vs-direct-routes-which-is-right-for-your-run).

## Building a direct route with the direct route builder

Direct mode is for the days you already know the line. Hyde Park to the water. A loop you have run on Tuesday for a year. You click, it connects, you do not want the router inventing a scenic detour through three extra parks.

Click in order. The line follows your points. If you need the path to thread a particular gate, put a point on that gate. Direct will not “notice” the gate because it is pretty.

Direct still draws a pedestrian route, not a crow-flies polyline across buildings. If the legal path around a block is longer than the diagonal you imagined, that is the map telling you the truth.

Use direct to stitch low-stop segments you already like. Example: low-stop from home to a park entry, then direct around the park loop you always run, then low-stop home on a different street so you do not repeat the same lights. That is still one saved route. Save it under a name you will recognise at 6 a.m., not “Sydney run” unless you want a pile of identical names.

For the click-by-click Direct build on the Route builder panel, including start, finish, and loops, read [how to use the Run Without Stops route builder](/blog/how-to-use-the-run-without-stops-route-builder).

## Understanding running route intelligence

The intelligence on this map is visible. It is not a hidden score.

- **Traffic lights** show where you will wait if the line stays on that street.
- **Crossings** show where pedestrians are meant to get over the road.
- **Highways** are the corridors you usually want the line to refuse.
- **Busy roads** are the next tier down: still loud, still pinched, still a reason to slide one street over.
- **Parks** are the green you came for. They are also how you skip a block of signals if the gate is in the right place.
- **Drinking water** is a planning object, not a novelty. On a warm Sydney morning, a fountain on the line is a reason to keep a waypoint.

All of that is OpenStreetMap, loaded for the area you are looking at. If a light is missing, OSM may be missing it. If a park path is missing, the router cannot use it. The honest move is to treat the layers as the current map, then adjust a waypoint when the street in front of you disagrees.

Search is worldwide. Type a park, a suburb, a city. Results bias toward the map you are looking at. If nothing comes back, try a more specific name.

Shared routes live at a `/r/` link after you save. That URL is for a person you chose, not for search engines. The public pages to index are the [map](/) and these [notes](/blog).

## Can you map a running route without interruptions?

You can get close. You cannot delete Sydney.

A true zero-stop line would need a corridor with no signals, no highway, and no busy road for the whole distance. Some park loops and some coastal paths get near that. A suburb-to-suburb commute rarely does. Low-stop routing exists because “fewer” is the version you can actually ship.

The practical test: generate the line, turn every relevant layer on, and count the remaining light marks on the path. If you can move one waypoint and drop two lights, do that. If the remaining mark is the only way across a six-lane road, keep it and stop hunting for a fantasy gate.

Interruptions also include hills you did not ask for, a missing water tap, and a highway ramp the first draft hugged because the geometry was short. Those are all on the map. Look at them before you lace up.

## Common mistakes

1. **Leaving low-stop off because direct looks cleaner.** Direct is cleaner because it ignored the lights. You will meet them later.
2. **Hiding the traffic-light layer after the line appears.** The line is a proposal. The marks are the evidence.
3. **Closing a loop on the same arterial you arrived on.** You just doubled the signals.
4. **Using Avoid hills as the only switch.** Flat plus a highway is still a bad run.
5. **Dropping two points 12 km apart with no intermediate click through a park you actually want.** The router will pick a legal path. It may not pick your park.
6. **Expecting lights to load for a whole country.** Zoom into the streets you will run before you trust the layers.

## FAQs

### What is the best running route planner for fewer stops?

One that shows traffic lights, highways, and busy roads on the same canvas you draw, then builds a pedestrian line that can skip them. That is the [Run Without Stops map](/). It is free. Sign-in is only for save and share.

### How do I plan a nonstop running route in Sydney?

Click a start, click a finish, choose low-stop, and read the light and busy-road layers. Add waypoints for park gates and water. Move a point when the first draft still sits on a junction you know is miserable.

### Does low-stop routing avoid every traffic light?

No. It prefers quieter geometry. A remaining signal on the line is a real signal. Slide a waypoint or accept that this is the crossing you have.

### When should I use the direct route builder?

When you already know the streets and want the clicks respected. Park loops you have run for years. A short link between two low-stop segments. Not for the first time you try to get from a terrace in the inner west to the water.

### Can I flatten hills on a planned run?

Choose Low stops, turn Avoid hills on, regenerate, and read the elevation marks. Add a waypoint on the lower street if a pinch remains. It reduces climbing. It does not iron Sydney.

### Does Run Without Stops work outside Sydney?

Yes. Search a city, zoom the map, or start from where you are. Lights and routing load for the streets on screen.

Open the [map](/), drop two points in a neighbourhood you actually run, and leave the traffic-light layer on while the line draws. That is the review. If the line still looks like a bus route, move a point and generate it again.
