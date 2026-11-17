/**
 * Selects one visible accordion card.
 * The actual editor components stay mounted.
 */
export function getNextAccordionSelection(
  currentId: number | null,
  clickedId: number,
): number | null {
  if (!Number.isSafeInteger(clickedId) || clickedId <= 0) {
    return currentId;
  }

  return currentId === clickedId ? null : clickedId;
}