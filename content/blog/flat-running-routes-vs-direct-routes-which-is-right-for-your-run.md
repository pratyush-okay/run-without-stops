---
title: "Flat Running Routes vs Direct Routes: Which Is Right for Your Run?"
seoTitle: "Flat running route planner"
description: "Direct follows your clicks. A flat running route planner is Low stops plus Avoid hills: extra metres can win if they cut the climb. How to choose on the map."
date: "2026-09-18"
slug: flat-running-routes-vs-direct-routes-which-is-right-for-your-run
tags:
  - routing
  - elevation
  - direct
faqs:
  - question: What is a flat running route planner?
    answer: On this map it is Low stops with Avoid hills on. The router still follows legal pedestrian streets, and it can spend extra metres to keep the profile calmer. Direct does not show that switch.
  - question: When is Direct better than a running route that avoids hills?
    answer: Use Direct when you already know the streets and want the clicks respected, such as a park loop. Use Avoid hills when a pinch up to a ridge would turn an easy distance into a climb you did not ask for.
  - question: Can I turn Avoid hills on with Direct?
    answer: No. Avoid hills only appears when Low stops is selected. Choose Low stops, turn Avoid hills on, then add a waypoint on the lower street if a climb remains.
  - question: Why is the flatter line longer?
    answer: Elevation-aware running directions trade distance for less climbing. A longer street behind the ridge can beat a short pinch. Read the elevation marks, then decide whether those extra metres are the session you wanted.
  - question: Does Avoid hills make the run pancake-flat?
    answer: No. It raises the cost of steep slopes in the routing request. Ridges still exist. If a climb remains on a section you care about, put a waypoint on the lower street you will actually run.
howTo:
  name: How to plan a flatter running route
  anchor: how-to-plan-a-flatter-running-route
  steps:
    - name: Open the map
      text: Search a city, zoom until streets appear, or start from where you are.
    - name: Set start and finish
      text: Click a start, add a finish, and add a park gate or lower street if you already know one.
    - name: Choose Low stops
      text: Avoid hills only appears after Low stops is selected. Direct will not flatten the profile.
    - name: Turn Avoid hills on
      text: Turn it on before the line comes back. The request then costs steep slopes more than flatter streets.
    - name: Read the elevation marks
      text: Confirm the remaining climbs. Move a waypoint onto a lower street if a pinch is still on the line.
    - name: Keep lights visible
      text: A flat highway shoulder is still a chopped run. Leave traffic lights, highways, and busy roads on while you review.
    - name: Export or save
      text: Export GPX or an image with no account. Sign in only to save or share a private link.
---

## TL;DR

A [flat running route planner](/blog/the-complete-guide-to-building-a-run-without-stops) on this map is **Low stops** with **Avoid hills** on: extra metres can win when they cut the climb. **Direct** follows your clicks on legal pedestrian streets and does not show that switch. Open the [Run Without Stops map](/), choose Low stops, turn Avoid hills on, then read the elevation marks before you lace up.

## What a flat running route planner changes

**A flat running route planner** is a request that treats climbing as part of the cost, not a surprise after you already committed to the shortest walk.

Direct is the other request. You click start and finish. The line follows the order of those clicks. Motorways still cost more than a back street, so you are less likely to end on a shoulder, but a ridge on the shortest legal path still sits on the line.

Avoid hills is elevation-aware running directions for the same canvas. It only appears when Low stops is selected. The GraphHopper request then raises the cost of steep slopes ([GraphHopper custom models, `max_slope`](https://github.com/graphhopper/graphhopper/blob/master/docs/core/custom-models.md)), so a longer flatter street can beat a pinch of about 6% and up. If the slope model is missing for that area, the planner retries without the hill switch rather than failing the line.

The product name is still about waits. A pancake-flat highway is a bad run. Use Avoid hills with Low stops, and leave traffic lights, highways, and busy roads visible.

## Flat vs Direct vs Low stops

| Choice | What it asks for | What it will still do | When to use it |
| --- | --- | --- | --- |
| Direct | Pedestrian line between your clicks | Follow a ridge if that is the legal short path | Park loops and streets you already run |
| Low stops | Skip lights, highways, and busy roads when a quieter legal line exists | Climb if the quiet street goes over the hill | Weekday streets you do not already know |
| Low stops + Avoid hills | Quieter streets, with steep slopes costing more | Keep a climb if every legal option goes over the ridge | Easy distance you do not want turned into a hill session |

Direct is the right answer when the line is already yours. Hyde Park to the water. The Tuesday park loop. A gate you always take. The [Route builder how-to](/blog/how-to-use-the-run-without-stops-route-builder) is that click sequence.

A running route that avoids hills is the right answer when the same distance would otherwise include a pinch you did not plan. Inner-west sandstone, a coastal climb off a beach path, a suburb that only looks flat on the 2D map. Low stops without Avoid hills can still send you up that pinch if the quiet street is the one that climbs.

You can mix both on one saved route. Example: Low stops plus Avoid hills from home to a park gate, Direct around the loop you always run, Low stops home on a different street so you do not repeat the same lights.

## Why the profile changes the session

An 8 km line with 80 m of climb is a different run from 8 km along a park edge. You feel it in the first pinch, then you spend the rest of the session paying for it. Distance on the watch does not mention that.

Downhill does not give the climb back. You still did the lifting work. Equivalent-distance work on hilly races treats elevation as part of the effort, not a footnote ([Dewyngaert, equivalent distances from elevation profiles](https://dial.uclouvain.be/pr/boreal/object/boreal:206650)). You do not need a formula on this map. You need the elevation marks on the line before you go.

After a line exists, the map shows climb and descent marks, and the summary shows gain and loss plus a profile chart. Scrub along the line if you want the height at a specific point. Compare two drafts of the same start and finish: Direct, then Low stops with Avoid hills. Keep the draft whose remaining climb you will actually run.

Busy roads add a second cost even on a flat shoulder: buses, a pinched footpath, a corner you take wide. That is why Avoid hills is not a substitute for Low stops. The [low-stop how-to](/blog/how-to-build-low-stop-running-routes-with-run-without-stops) is the quieter-street sequence. This page is when to add the hill switch.

## How to plan a flatter running route

1. Open the [map](/). Search a city, zoom until streets appear, or start from where you are. The camera still opens on Sydney if the browser has no location yet.
2. Set a start and a finish. Add a park gate or a lower street if you already know one.
3. Choose **Low stops**. **Avoid hills** only appears after that. Direct will not flatten the profile.
4. Turn **Avoid hills** on before the line comes back.
5. Turn on **traffic lights**, **highways**, and **busy roads**. A flat highway is still a chopped run.
6. Read the elevation marks. If a climb still sits on a section you care about, drop a waypoint on the lower street you will actually run and generate again.
7. Count remaining light marks. If you can move one point and drop two lights without taking a worse hill, do that.
8. Export GPX or an image with no account. Sign in only to save a named line or share a `/r/` link.

That loop is the planner. The intelligence is the switches plus the marks, not a hidden training model.

## Edge cases

If every legal pedestrian option goes over the same ridge, Avoid hills cannot invent a tunnel. Keep the climb, or change the finish.

If the first flatter line hugs a highway because the shoulder is level, that is the geometry winning. Put a point on the residential parallel. Low stops prefers quieter streets. Avoid hills prefers less climbing. You still have to refuse the shoulder.

If Avoid hills seems to do nothing, the area may lack a slope model, or the remaining climb may already be the cheapest legal option. Read the marks. Move a waypoint. Do not assume the switch failed because the 2D map looks flat.

Export still lists gain when a line exists. Use that number next to distance, not instead of the chart. A small net gain can hide a dip and a matching climb.

Closing a loop on the same arterial you climbed into doubles the pinch and the lights. Finish on a different street, or leave it point-to-point.

Search is worldwide. Type a park, a suburb, a city. Zoom to streets before you trust overlays or the profile. Layers and routing load for the viewport, not for a whole country at once.

## Common mistakes

1. **Leaving Direct on and looking for Avoid hills.** The switch is hidden until Low stops is selected.
2. **Using Avoid hills as the only switch.** Flat plus a highway is still a chopped run.
3. **Two clicks 12 km apart with no lower-street waypoint.** The router picks a legal path. It may not pick the valley you meant.
4. **Hiding elevation marks after the line appears.** The line is a proposal. The profile is the evidence.
5. **Expecting pancake-flat kilometres in a ridged city.** Avoid hills reduces climbing. It does not iron sandstone.
6. **Closing the loop on the arrival climb.** You just ran the pinch twice.

## FAQs

### What is a flat running route planner?

On this map it is Low stops with Avoid hills on. The router still follows legal pedestrian streets, and it can spend extra metres to keep the profile calmer. Direct does not show that switch.

### When is Direct better than a running route that avoids hills?

Use Direct when you already know the streets and want the clicks respected. Use Avoid hills when a pinch would turn an easy distance into a climb you did not ask for. The [Route builder how-to](/blog/how-to-use-the-run-without-stops-route-builder) is the Direct sequence.

### Can I turn Avoid hills on with Direct?

No. Choose Low stops first. Then turn Avoid hills on, read the elevation marks, and move a waypoint if a pinch remains.

### Why is the flatter line longer?

Elevation-aware running directions trade distance for less climbing. A longer street behind the ridge can beat a short pinch. If those extra metres include lights you refuse, move a point or leave Avoid hills off for that segment.

### Does Avoid hills make the run pancake-flat?

No. It raises the cost of steep slopes. Ridges still exist. Put a waypoint on the lower street you will actually run, then read the [complete guide](/blog/the-complete-guide-to-building-a-run-without-stops) if you also need lights, water, save, and share.

Open the [map](/), drop two points in a neighbourhood with a ridge you already know, choose Low stops, turn Avoid hills on, and read the elevation marks. If the pinch is still on the line, move a point.
