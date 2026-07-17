import {
  ArrowDownAZ,
  CopyCheck,
  Download,
  FileSpreadsheet,
  GitCompareArrows,
  Terminal,
} from 'lucide-react';
import type { ToolDefinition } from '@/types/tools';
import { GenerateAppSettings } from './generate-appsettings/GenerateAppSettings';
import { CompareAppSettings } from './compare-appsettings/CompareAppSettings';
import { CsvImport } from './csv-import/CsvImport';
import { ExportGroup } from './export-group/ExportGroup';
import { DuplicateFinder } from './duplicate-finder/DuplicateFinder';
import { SortAppSettings } from './sort-appsettings/SortAppSettings';

/**
 * The single source of truth for tools. The sidebar and routes are generated
 * from this array — adding a tool means adding one entry here plus its feature
 * component. Built to scale to dozens of tools.
 */
export const TOOLS: readonly ToolDefinition[] = [
  {
    id: 'generate-appsettings',
    title: 'Generate App Service Settings',
    description: 'Build the -KEY "$(KEY)" string from a variable group.',
    icon: Terminal,
    group: 'Variable Groups',
    path: '/tools/generate-appsettings',
    component: GenerateAppSettings,
    requiresConnection: true,
  },
  {
    id: 'compare-appsettings',
    title: 'Compare vs App Settings',
    description: 'Diff a variable group against pasted App Settings.',
    icon: GitCompareArrows,
    group: 'Variable Groups',
    path: '/tools/compare-appsettings',
    component: CompareAppSettings,
    requiresConnection: true,
  },
  {
    id: 'csv-import',
    title: 'CSV Import',
    description: 'Import Key,Value pairs into a variable group.',
    icon: FileSpreadsheet,
    group: 'Variable Groups',
    path: '/tools/csv-import',
    component: CsvImport,
    requiresConnection: true,
  },
  {
    id: 'export-group',
    title: 'Export Variable Group',
    description: 'Export a variable group as CSV, JSON, or TXT.',
    icon: Download,
    group: 'Variable Groups',
    path: '/tools/export-group',
    component: ExportGroup,
    requiresConnection: true,
  },
  {
    id: 'duplicate-finder',
    title: 'Duplicate Finder',
    description: 'Find duplicate keys in pasted App Settings.',
    icon: CopyCheck,
    group: 'App Settings',
    path: '/tools/duplicate-finder',
    component: DuplicateFinder,
    requiresConnection: false,
  },
  {
    id: 'sort-appsettings',
    title: 'Sort App Settings',
    description: 'Sort pasted App Settings alphabetically.',
    icon: ArrowDownAZ,
    group: 'App Settings',
    path: '/tools/sort-appsettings',
    component: SortAppSettings,
    requiresConnection: false,
  },
];

export const DEFAULT_TOOL_PATH = TOOLS[0]!.path;

/** Tool groups in display order. */
export const TOOL_GROUPS = ['Variable Groups', 'App Settings'] as const;

export function toolsByGroup() {
  return TOOL_GROUPS.map((group) => ({
    group,
    tools: TOOLS.filter((t) => t.group === group),
  }));
}
