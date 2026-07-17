/**
 * Order-independent comparison between a Variable Group's keys and a set of
 * App Settings keys. Order never affects results.
 */

export interface KeyComparison {
  /** Keys present in both. */
  matched: string[];
  /** In the variable group but not in the app settings. */
  missingFromAppSettings: string[];
  /** In the app settings but not in the variable group. */
  extraInAppSettings: string[];
  /** App-settings keys that appeared more than once. */
  duplicatesInAppSettings: string[];
  counts: {
    matched: number;
    missingFromAppSettings: number;
    extraInAppSettings: number;
    duplicatesInAppSettings: number;
  };
}

/**
 * Compare group keys against parsed app-settings keys.
 * @param groupKeys distinct variable-group keys
 * @param appSettingsKeys keys as they appear (duplicates included)
 */
export function compareKeys(groupKeys: string[], appSettingsKeys: string[]): KeyComparison {
  const groupSet = new Set(groupKeys);

  const appCounts = new Map<string, number>();
  for (const k of appSettingsKeys) {
    appCounts.set(k, (appCounts.get(k) ?? 0) + 1);
  }
  const appSet = new Set(appCounts.keys());

  const matched: string[] = [];
  const missingFromAppSettings: string[] = [];
  const extraInAppSettings: string[] = [];
  const duplicatesInAppSettings: string[] = [];

  for (const k of groupSet) {
    if (appSet.has(k)) matched.push(k);
    else missingFromAppSettings.push(k);
  }
  for (const k of appSet) {
    if (!groupSet.has(k)) extraInAppSettings.push(k);
  }
  for (const [k, c] of appCounts) {
    if (c > 1) duplicatesInAppSettings.push(k);
  }

  const sort = (a: string, b: string) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' });
  matched.sort(sort);
  missingFromAppSettings.sort(sort);
  extraInAppSettings.sort(sort);
  duplicatesInAppSettings.sort(sort);

  return {
    matched,
    missingFromAppSettings,
    extraInAppSettings,
    duplicatesInAppSettings,
    counts: {
      matched: matched.length,
      missingFromAppSettings: missingFromAppSettings.length,
      extraInAppSettings: extraInAppSettings.length,
      duplicatesInAppSettings: duplicatesInAppSettings.length,
    },
  };
}
