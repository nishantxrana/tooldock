/** Azure DevOps REST API types (subset used by ToolDock). */

/** Generic list envelope returned by most ADO list endpoints. */
export interface AdoListResponse<T> {
  count: number;
  value: T[];
}

/** A project in the organization. */
export interface Project {
  id: string;
  name: string;
  description?: string;
  state?: string;
  visibility?: string;
  lastUpdateTime?: string;
}

/** A wrapper class for a generic variable. */
export interface VariableValue {
  value?: string;
  isSecret?: boolean;
  isReadOnly?: boolean;
}

/** Map of variable name -> value wrapper. */
export type VariableMap = Record<string, VariableValue>;

export interface ProjectReference {
  id: string;
  name?: string;
}

/** Shallow reference tying a variable group to a project it is shared with. */
export interface VariableGroupProjectReference {
  name?: string;
  description?: string;
  projectReference: ProjectReference;
}

/** A variable group is a collection of related variables. */
export interface VariableGroup {
  id: number;
  name: string;
  description?: string;
  type: string;
  variables: VariableMap;
  variableGroupProjectReferences?: VariableGroupProjectReference[];
  isShared?: boolean;
  createdOn?: string;
  modifiedOn?: string;
}

// ---------------------------------------------------------------------------
// Release Definitions
// ---------------------------------------------------------------------------

/** Lightweight reference returned by the release definitions list endpoint. */
export interface ReleaseDefinitionRef {
  id: number;
  name: string;
}

/** Inline variable value as returned by the release definition endpoint. */
export interface ReleaseVariable {
  value?: string;
  isSecret?: boolean;
}

/** One stage (environment) within a release definition. */
export interface ReleaseEnvironment {
  id: number;
  name: string;
  /** Inline variables defined specifically for this stage. */
  variables: Record<string, ReleaseVariable>;
  /** IDs of variable groups attached specifically to this stage. */
  variableGroups: number[];
}

/** Full release definition returned by the single-definition GET endpoint. */
export interface ReleaseDefinition {
  id: number;
  name: string;
  /** Inline variables shared across all stages. */
  variables: Record<string, ReleaseVariable>;
  /** IDs of variable groups attached at definition level (shared across all stages). */
  variableGroups: number[];
  environments: ReleaseEnvironment[];
}

/**
 * Body for PUT .../variablegroups/{groupId}. The full variable map, name, type,
 * description AND variableGroupProjectReferences must be sent — omitting the
 * project references un-shares the group.
 */
export interface VariableGroupUpdateBody {
  name: string;
  description: string;
  type: string;
  variables: VariableMap;
  variableGroupProjectReferences: VariableGroupProjectReference[];
}
