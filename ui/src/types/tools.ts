import type { ComponentType } from 'react';
import type { LucideIcon } from 'lucide-react';

/** Logical grouping shown as a section header in the sidebar. */
export type ToolGroup = 'Variable Groups' | 'Release Pipelines' | 'App Settings';

/**
 * A single tool. Sidebar entries and routes are generated from the registry of
 * these, so adding a tool = adding one ToolDefinition + one feature component.
 */
export interface ToolDefinition {
  /** Stable id / route slug, e.g. "generate-appsettings". */
  id: string;
  title: string;
  /** Short one-line description shown in cards and tooltips. */
  description: string;
  icon: LucideIcon;
  group: ToolGroup;
  /** Route path, e.g. "/tools/generate-appsettings". */
  path: string;
  component: ComponentType;
  /** True if the tool needs a connected session + selected project. */
  requiresConnection: boolean;
}
