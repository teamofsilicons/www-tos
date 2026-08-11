export const BOOKLET_PAGE_COUNT = 12;

/**
 * Physical sheets of the booklet. Each sheet carries two printed faces, so
 * turning sheet `n` reveals the back of `n` on the left and the front of
 * `n + 1` on the right, exactly like the printed piece.
 */
export const bookletSheets: { front: number; back: number }[] = [
  { front: 1, back: 2 },
  { front: 3, back: 4 },
  { front: 5, back: 6 },
  { front: 7, back: 8 },
  { front: 9, back: 10 },
  { front: 11, back: 12 },
];

export function bookletPageSrc(pageNumber: number) {
  return `/booklet/page-${String(pageNumber).padStart(2, "0")}.jpg`;
}
