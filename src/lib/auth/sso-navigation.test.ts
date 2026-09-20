import { SSO_COMPLETE_PATH } from "@/lib/auth/oauth";
import { navigateAfterSso } from "@/lib/auth/sso-navigation";

describe("navigateAfterSso", () => {
  it("hard-navigates home after a completed session", () => {
    const assign = vi.fn();
    navigateAfterSso({
      session: { currentTask: null },
      decorateUrl: (url) => url,
      assign,
    });
    expect(assign).toHaveBeenCalledWith(SSO_COMPLETE_PATH);
  });

  it("still leaves the Connecting page when a session task is pending", () => {
    const assign = vi.fn();
    navigateAfterSso({
      session: { currentTask: { key: "choose-organization" } },
      decorateUrl: (url) => url,
      assign,
    });
    expect(assign).toHaveBeenCalledWith(SSO_COMPLETE_PATH);
  });

  it("uses Clerk's decorated URL so Safari can refresh cookies", () => {
    const assign = vi.fn();
    navigateAfterSso({
      decorateUrl: (url) => `https://accounts.example${url}`,
      assign,
    });
    expect(assign).toHaveBeenCalledWith("https://accounts.example/");
  });
});
