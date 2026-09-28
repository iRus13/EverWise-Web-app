import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { catalogSource } from "../scripts/build-course-catalog.mjs";
import * as catalog from "../src/data/course-catalog.js";
import * as content from "../src/data/lessons.js";
import { requiredCourseIds } from "../src/utils/courseProgress.js";

test("startup catalog matches authored curriculum; regenerate after content edits", async () => {
  assert.equal(await readFile(new URL("../src/data/course-catalog.js", import.meta.url), "utf8"), catalogSource(), "Run node scripts/build-course-catalog.mjs");
});
test("deferred content preserves course order, completion requirements and badges", () => {
  const required = source => requiredCourseIds(source.lessonsByOrder, source.challengesByOrder, source.examsByOrder);
  assert.deepEqual(required(catalog), required(content));
  for (const name of ["lessonsByOrder", "challengesByOrder", "examsByOrder"]) {
    catalog[name].forEach((item, index) => {
      assert.equal(item.badge, content[name][index].badge);
      assert.equal(item.phaseBadge, content[name][index].phaseBadge);
      assert.deepEqual(item.complete, content[name][index].complete);
      assert.equal(item.blocks, undefined);
      assert.equal(item.quiz, undefined);
      assert.equal(item.questions, undefined);
    });
  }
});
