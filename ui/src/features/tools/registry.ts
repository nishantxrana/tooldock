import {
  ArrowDownAZ,
  CopyCheck,
  Download,
  FileSpreadsheet,
  GitBranch,
  GitCompareArrows,
  Layers,
  Terminal,
} from 'lucide-react';
import type { ToolDefinition } from '@/types/tools';
import { GenerateAppSettings } from './generate-appsettings/GenerateAppSettings';
import { CompareAppSettings } from './compare-appsettings/CompareAppSettings';
import { CsvImport } from './csv-import/CsvImport';
import { ExportGroup } from './export-group/ExportGroup';
import { ExportAllGroups } from './export-all-groups/ExportAllGroups';
import { ReleaseGroupMapping } from './release-group-mapping/ReleaseGroupMapping';
import { ExportReleaseVars } from './export-release-vars/ExportReleaseVars';
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
    id: 'export-all-groups',
    title: 'Export All Variable Groups',
    description: 'Export a project’s variable groups into one XLSX workbook.',
    icon: Layers,
    group: 'Variable Groups',
    path: '/tools/export-all-groups',
    component: ExportAllGroups,
    requiresConnection: true,
  },
  {
    id: 'export-release-vars',
    title: 'Export Release Variables',
    description: 'Export inline pipeline variables to CSV, JSON, TXT, or XLSX for migration to a variable group.',
    icon: GitBranch,
    group: 'Release Pipelines',
    path: '/tools/export-release-vars',
    component: ExportReleaseVars,
    requiresConnection: true,
  },
  {
    id: 'release-group-mapping',
    title: 'Release Pipeline Mapping',
    description: 'See which release pipelines use each variable group. Export to XLSX.',
    icon: GitBranch,
    group: 'Release Pipelines',
    path: '/tools/release-group-mapping',
    component: ReleaseGroupMapping,
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
export const TOOL_GROUPS = ['Variable Groups', 'Release Pipelines', 'App Settings'] as const;

export function toolsByGroup() {
  return TOOL_GROUPS.map((group) => ({
    group,
    tools: TOOLS.filter((t) => t.group === group),
  }));
}
