import React from "react";
import { afterEach, expect, test, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import ScamChecker from "../src/screens/ScamChecker.jsx";
import {setLocale} from "../src/i18n/index.js";

afterEach(() => { cleanup(); setLocale("en"); vi.unstubAllGlobals(); });

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
    expect(narration.indexOf("What to do next:")).toBeLessThan(narration.indexOf("Warning signs:"));
    expect(narration).toContain("This is an AI assessment, not a guarantee.");
    expect(narration).not.toContain("Synthetic suspicious message");
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

test("switching to Spanish refreshes narration labels and leaves returned prose verbatim", async () => {
  const spoken=vi.fn();
  const assessment={verdict:"uncertain",summary:"Texto devuelto por el servicio.",urgent_action:"No envíes dinero.",warning_signs:["Una petición inesperada."],next_steps:["Llama a un número conocido."]};
  vi.stubGlobal("SpeechSynthesisUtterance",class {constructor(text){this.text=text;}});
  vi.stubGlobal("speechSynthesis",{cancel:vi.fn(),speak:spoken});
  vi.stubGlobal("fetch",vi.fn(async url=>String(url).endsWith("/api/check-message")?{ok:true,json:async()=>assessment}:{ok:false,status:503}));
  render(<ScamChecker onBack={()=>{}}/>);
  fireEvent.change(screen.getByLabelText("Message to check"),{target:{value:"Private draft omitted from narration"}});
  fireEvent.click(screen.getByRole("button",{name:"Check this message"}));
  await screen.findByRole("heading",{name:"Verify before deciding"});
  act(()=>setLocale("es"));
  fireEvent.click(screen.getByRole("button",{name:"Leer este resultado en voz alta"}));
  await waitFor(()=>expect(spoken).toHaveBeenCalledOnce());
  const utterance=spoken.mock.calls[0][0];
  expect(utterance.lang).toBe("es");
  expect(utterance.text).toContain("Verifica antes de decidir");
  expect(utterance.text).toContain(assessment.summary);
  expect(utterance.text).toContain("Actúa ahora: No envíes dinero.");
  expect(utterance.text).toContain("Qué hacer a continuación:");
  expect(utterance.text).toContain("Señales de alerta:");
  expect(utterance.text).toContain("Nunca uses enlaces");
  expect(utterance.text).not.toContain("Private draft");
  expect(utterance.text).not.toMatch(/Warning signs:|What to do next:|Never use a link/);
});
