import { chatGreetingName, clampChatWidth, messageText } from "@/lib/agent/chat-ui";

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
