export const TABLET_MIN_WIDTH = 700;
export const WIDE_LAYOUT_MIN_WIDTH = 1024;
export const MAX_APP_SHELL_WIDTH = 1180;

export function isTabletWidth(width: number): boolean {
  return width >= TABLET_MIN_WIDTH;
}

export function pageHorizontalPadding(width: number): number {
  if (width >= WIDE_LAYOUT_MIN_WIDTH) return 32;
  if (width >= TABLET_MIN_WIDTH) return 28;
  return 20;
}
