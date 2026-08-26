import type { Theme } from "./types";
import { classicThemes } from "./classic";
import { extraThemes } from "./extra";
import { modernThemes } from "./modern";

export type { Theme };

export interface ThemeGroup {
  label: string;
  themes: Theme[];
}

export const THEMES: Theme[] = [...classicThemes, ...modernThemes, ...extraThemes];

export const THEME_GROUPS: ThemeGroup[] = [
  { label: "经典", themes: classicThemes },
  { label: "潮流", themes: modernThemes },
  { label: "更多风格", themes: extraThemes },
];

export const DEFAULT_THEME_ID = "wechat";

export function findTheme(themeId: string | undefined): Theme | undefined {
  return THEMES.find((theme) => theme.id === themeId);
}

export function getTheme(themeId: string | undefined): Theme {
  return findTheme(themeId) ?? findTheme(DEFAULT_THEME_ID) ?? THEMES[0]!;
}

export function isThemeId(themeId: string): boolean {
  return findTheme(themeId) !== undefined;
}
