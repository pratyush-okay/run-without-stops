import {
  chatGreetingName,
  clampChatWidth,
  combinedUserText,
  isPlanRunInFlight,
  isRouteBuildRequest,
  lastUserText,
  messageText,
  planRunProposalsFromParts,
  routeReplyText,
  routeToolSteps,
} from "@/lib/agent/chat-ui";

describe("clampChatWidth", () => {
  it("keeps the pane between the min and the viewport cap", () => {
    expect(clampChatWidth(100, 1200)).toBe(280);
    expect(clampChatWidth(900, 1200)).toBe(640);
    expect(clampChatWidth(500, 600)).toBe(432);
  });
});

describe("chatGreetingName", () => {
  it("prefers the first name and falls back to the first full-name word", () => {
    expect(chatGreetingName({ firstName: "Pratyush", fullName: "Pratyush Panda" })).toBe(
      "Pratyush",
    );
    expect(chatGreetingName({ firstName: "  ", fullName: "Ada King" })).toBe("Ada");
    expect(chatGreetingName(null)).toBeUndefined();
  });
});

describe("messageText", () => {
  it("joins text parts", () => {
    expect(
      messageText([
        { type: "text", text: "Hello " },
        { type: "step-start" },
        { type: "text", text: "there" },
      ]),
    ).toBe("Hello there");
  });
});

describe("route request detection", () => {
  it("treats around-me distance asks as route builds", () => {
    expect(isRouteBuildRequest("Make a 6k loop around me")).toBe(true);
    expect(isRouteBuildRequest("I want to include a park as well")).toBe(true);
    expect(isRouteBuildRequest("hi")).toBe(false);
    expect(isRouteBuildRequest("try again", "Make a 6k loop around me")).toBe(true);
    expect(
      lastUserText([
        { role: "assistant", parts: [{ type: "text", text: "Hi" }] },
        { role: "user", parts: [{ type: "text", text: "Make a 6k loop around me" }] },
      ]),
    ).toBe("Make a 6k loop around me");
    expect(
      combinedUserText([
        { role: "user", parts: [{ type: "text", text: "Make a 6k loop around me" }] },
        { role: "assistant", parts: [{ type: "text", text: "Sorry" }] },
        { role: "user", parts: [{ type: "text", text: "I want to include a park as well" }] },
      ]),
    ).toBe("Make a 6k loop around me\nI want to include a park as well");
  });
});

describe("planRun tool parts", () => {
  const proposal = {
    ok: true as const,
    points: [
      { lat: -33.86, lng: 151.21 },
      { lat: -33.87, lng: 151.22 },
      { lat: -33.86, lng: 151.21 },
    ],
    knownLabels: { "-33.86000,151.21000": "Start" },
    mode: "low_stops" as const,
    avoidElevation: false,
    targetMeters: 5_000,
    summary: "About a 5.0 km loop.",
    included: [],
  };

  it("extracts a finished planRun proposal and ignores in-flight calls", () => {
    expect(
      isPlanRunInFlight([{ type: "tool-planRun", toolCallId: "t1", state: "input-available" }]),
    ).toBe(true);

    expect(
      planRunProposalsFromParts([
        { type: "tool-planRun", toolCallId: "t1", state: "input-available", output: proposal },
        { type: "tool-planRun", toolCallId: "t2", state: "output-available", output: proposal },
      ]),
    ).toEqual([{ toolCallId: "t2", proposal }]);
    expect(routeReplyText(proposal)).toBe("About a 5.0 km loop. It's on the map.");
    expect(routeToolSteps(proposal)).toEqual([
      "Aimed for 5.00 km.",
      "Chose Low stops, preferring fewer lights.",
      "Placed the stops on the map. A street line did not come back.",
    ]);
  });

  it("lists the places and the street line beside the short reply", () => {
    const planned = {
      ...proposal,
      summary: "About a 5.00 km loop via Phillip Park.",
      included: [{ name: "Phillip Park" }],
      route: {
        metrics: {
          distanceMeters: 5_120,
          durationSeconds: 28 * 60,
          trafficSignals: 14,
          crossings: 6,
          ascentMeters: 12,
          majorRoadMeters: 240,
        },
      },
    };
    expect(routeReplyText(planned)).toBe("About a 5.00 km loop via Phillip Park. It's on the map.");
    expect(routeToolSteps(planned)).toEqual([
      "Aimed for 5.00 km.",
      "Sent the loop through Phillip Park.",
      "Chose Low stops, preferring fewer lights.",
      "Drew a 5.12 km street line, about 28 min, with 14 traffic lights, 6 crossings, 12 m up, 240 m on major roads.",
    ]);
  });
});
