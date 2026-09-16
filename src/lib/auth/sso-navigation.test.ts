import { SSO_COMPLETE_PATH } from "@/lib/auth/oauth";
import { navigateAfterSso } from "@/lib/auth/sso-navigation";

describe("navigateAfterSso", () => {
  it("leaves session tasks on the current page", () => {
    const router = { push: vi.fn() };
    navigateAfterSso({
      session: { currentTask: { key: "choose-organization" } },
      decorateUrl: (url) => url,
      router: router as never,
    });
    expect(router.push).not.toHaveBeenCalled();
  });

  it("sends completed sessions home", () => {
    const router = { push: vi.fn() };
    navigateAfterSso({
      session: { currentTask: null },
      decorateUrl: (url) => url,
      router: router as never,
    });
    expect(router.push).toHaveBeenCalledWith(SSO_COMPLETE_PATH);
  });
});
