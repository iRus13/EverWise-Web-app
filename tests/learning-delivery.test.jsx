import {expect, test} from "vitest";
import {learningItem} from "../src/screens/learningScreens.jsx";
import {lessonsByOrder, challengesByOrder, examsByOrder} from "../src/data/lessons.js";

// Compare every nested authored block, answer, explanation, completion label,
// ordering field and scoring field with the canonical full-course export.
for (const [kind, items] of Object.entries({lesson:lessonsByOrder,complete:lessonsByOrder,challenge:challengesByOrder,exam:examsByOrder})) {
  test.each(items.map(item => [item.id, item]))(`deferred ${kind} %s preserves the complete curriculum object`, async (id, expected) => {
    const result = await learningItem(kind, id);
    expect(result.item).toEqual(expected);
    expect(typeof result.Player).toBe("function");
  });
}

test.each([["lesson","not-a-lesson"],["lesson",examsByOrder[0].id],["exam",lessonsByOrder[0].id],["constructor","welcome"],["unknown","welcome"]])("unrecognized activity %s/%s fails without a substitute", async (kind,id) => {
  await expect(learningItem(kind,id)).rejects.toThrow("Learning content unavailable");
});
