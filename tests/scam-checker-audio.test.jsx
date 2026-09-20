import React from "react";
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import ScamChecker from "../src/screens/ScamChecker.jsx";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

test.each(["Contact your bank now using the number on your card.", null])(
  "result narration includes the displayed guidance with urgent action %j",
  async (urgentAction) => {
    const assessment = {
      verdict: "likely_scam", summary: "This message pressures you to send money.",
      urgent_action: urgentAction, warning_signs: ["An unexpected payment request"],
      next_steps: ["Verify the sender independently"],
    };
    const spoken = vi.fn();
    vi.stubGlobal("SpeechSynthesisUtterance", class { constructor(text) { this.text = text; } });
    vi.stubGlobal("speechSynthesis", { cancel: vi.fn(), speak: spoken });
    let providerText;
    vi.stubGlobal("fetch", vi.fn(async (url, options) => {
      if (String(url).endsWith("/api/check-message")) return { ok: true, json: async () => assessment };
      expect(String(url)).toMatch(/\/api\/read-aloud$/);
      providerText = JSON.parse(options.body).text;
      // Exercise the real ReadAloud component's device-voice fallback, too.
      return { ok: false, status: 503 };
    }));
    render(<ScamChecker onBack={() => {}} />);
    fireEvent.change(screen.getByLabelText("Message to check"), { target: { value: "Synthetic suspicious message" } });
    fireEvent.click(screen.getByRole("button", { name: "Check this message" }));
    fireEvent.click(await screen.findByRole("button", { name: "Read this result aloud" }));
    await waitFor(() => expect(spoken).toHaveBeenCalledOnce());
    const narration = spoken.mock.calls[0][0].text;
    expect(narration).toBe(providerText);
    expect(narration).toContain(assessment.summary);
    expect(narration).toContain(assessment.warning_signs[0]);
    expect(narration).toContain(assessment.next_steps[0]);
    expect(narration).toContain(screen.getByText(/^Never use a link, phone number/).textContent);
    if (urgentAction) {
      expect(screen.getByText(urgentAction)).toBeVisible();
      expect(narration).toContain(`Act now: ${urgentAction}`);
      expect(narration.indexOf(urgentAction)).toBeLessThan(narration.indexOf("Warning signs:"));
    } else {
      expect(narration).not.toContain("Act now:");
      expect(narration).not.toMatch(/null|undefined/);
    }
  },
);
