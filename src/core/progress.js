/**
 * Progress page model: sessions stay as they are; below them each practiced
 * relation shows its LATEST recorded outcome (right / wrong). Mastery status
 * is not used as the row label and is never changed here. No elapsed time,
 * slow flag, mistake count, due date or internal status name is exposed.
 */

/**
 * @param {object[]} catalog
 * @param {Record<string, object>} relations
 * @returns {{ id: string, domain: string, prompt: string, latestCorrect: boolean, day: string }[]}
 *   most recent day first; catalog order within a day.
 */
export function listLatestOutcomes(catalog, relations = {}) {
  const rows = [];
  catalog.forEach((item, index) => {
    const attempts = relations[item.id]?.attempts;
    if (!Array.isArray(attempts) || attempts.length === 0) return;
    const latestAttempt = attempts[attempts.length - 1];
    rows.push({
      id: item.id,
      domain: item.domain,
      prompt: item.prompt,
      latestCorrect: latestAttempt?.correct === true,
      day: typeof latestAttempt?.day === "string" ? latestAttempt.day : "",
      index,
    });
  });
  rows.sort((a, b) => (a.day === b.day ? a.index - b.index : a.day < b.day ? 1 : -1));
  return rows.map(({ index, ...row }) => row);
}
