import { invoke } from '@tauri-apps/api/core'
import type { RawSubagentData } from '@/types/subagent'

export type CcsRunEventKind = 'stdout' | 'stderr' | 'terminated' | 'error'

export interface CcsRunEventPayload {
  run_id: string
  kind: CcsRunEventKind
  chunk?: string
  code?: number
  message?: string
}

export interface SpawnCcsResult {
  run_id: string
  pid: number | null
}

export interface StopCcsResult {
  run_id: string
  stopped: boolean
  already_stopped: boolean
}

export interface SpawnCcsArgs {
  [key: string]: unknown
  profile: string
  command: string
  cwd: string
}

export async function gitStatus(path: string): Promise<unknown> {
  return invoke('git_status', { path })
}

export async function resolveHomePath(relative: string): Promise<string> {
  return invoke<string>('resolve_home_path', { relative })
}

export async function spawnCcs(args: SpawnCcsArgs): Promise<SpawnCcsResult> {
  return invoke<SpawnCcsResult>('spawn_ccs', args)
}

export async function stopCcs(runId: string): Promise<StopCcsResult> {
  return invoke<StopCcsResult>('stop_ccs', { runId }).catch((e) => {
    console.error('[stopCcs] error:', e, { runId })
    throw e
  })
}

export async function sendCcsInput(runId: string, data: string): Promise<void> {
  return invoke<void>('send_ccs_input', { runId, data }).catch((e) => {
    console.error('[sendCcsInput] error:', e, { runId, data })
    throw e
  })
}

export async function resumeCcsSession(
  sessionId: string,
  prompt: string,
  cwd: string,
): Promise<string> {
  return invoke<string>('resume_ccs_session', { sessionId, prompt, cwd }).catch((e) => {
    console.error('[resumeCcsSession] error:', e, { sessionId, cwd })
    throw e
  })
}

export async function findNewSessionLog(
  projectsDir: string,
  cwd: string | undefined,
  spawnTimeMs: number,
): Promise<string | null> {
  return invoke<string | null>('find_new_session_log', { projectsDir, cwd, spawnTimeMs })
}

export async function extractReportPathFromJsonl(jsonlPath: string): Promise<string | null> {
  return invoke<string | null>('extract_report_path_from_jsonl', { jsonlPath })
}

export async function watchSessionLog(sessionId: string, path: string): Promise<void> {
  return invoke<void>('watch_session_log', { sessionId, path })
}

export async function stopSessionLogWatch(sessionId: string): Promise<void> {
  return invoke<void>('stop_session_log_watch', { sessionId })
}

// =============================================================================
// DB Commands
// =============================================================================

/** Health check — returns number of tables */
export async function checkDb(): Promise<number> {
  return invoke<number>('check_db')
}

// =============================================================================
// CCS Account Commands
// =============================================================================

import type { CcsAccount, Project, Deck, AppSettings, BrainstormSession, KeyInsight } from '@/types'

/** Discover CCS profiles from ~/.ccs/ and save to DB */
export async function discoverCcsProfiles(): Promise<CcsAccount[]> {
  return invoke<CcsAccount[]>('discover_ccs_profiles')
}

/** Get all CCS accounts from DB */
export async function getCcsAccounts(): Promise<CcsAccount[]> {
  return invoke<CcsAccount[]>('get_ccs_accounts')
}

// =============================================================================
// Project Commands
// =============================================================================

export async function createProject(
  name: string,
  description: string | undefined,
  gitPath: string,
): Promise<Project> {
  return invoke<Project>('create_project', { name, description, gitPath })
}

export async function listProjects(): Promise<Project[]> {
  return invoke<Project[]>('list_projects')
}

export async function getActiveProject(): Promise<Project | null> {
  return invoke<Project | null>('get_active_project')
}

export async function setActiveProject(id: string): Promise<void> {
  return invoke<void>('set_active_project', { id })
}

export async function validateGitRepo(path: string): Promise<boolean> {
  return invoke<boolean>('validate_git_repo', { path })
}

export async function listDecks(projectId: string): Promise<Deck[]> {
  return invoke<Deck[]>('list_decks', { projectId })
}

// =============================================================================
// Dashboard Commands
// =============================================================================

export interface DashboardStats {
  activeTasks: number
  totalTasks: number
  doneTasks: number
  worktreeCount: number
  brainstormCount: number
}

export async function getDashboardStats(
  deckId: string | null,
  projectId: string | null,
): Promise<DashboardStats> {
  return invoke<DashboardStats>('get_dashboard_stats', { deckId, projectId })
}

// =============================================================================
// Settings Commands
// =============================================================================

export async function getSettings(): Promise<AppSettings> {
  return invoke<AppSettings>('get_settings')
}

export async function updateSettingsDb(settings: AppSettings): Promise<AppSettings> {
  return invoke<AppSettings>('update_settings', { settings })
}

// =============================================================================
// Brainstorm Commands
// =============================================================================

export async function createBrainstormSession(
  deckId: string,
  prompt: string,
): Promise<BrainstormSession> {
  return invoke<BrainstormSession>('create_brainstorm_session', { deckId, prompt })
}

export async function updateBrainstormSession(
  id: string,
  status?: string,
  sessionLogPath?: string,
  reportPath?: string,
): Promise<void> {
  return invoke<void>('update_brainstorm_session', { id, status, sessionLogPath, reportPath })
}

export async function listBrainstormSessions(deckId: string): Promise<BrainstormSession[]> {
  return invoke<BrainstormSession[]>('list_brainstorm_sessions', { deckId })
}

export async function getBrainstormSession(id: string): Promise<BrainstormSession | null> {
  return invoke<BrainstormSession | null>('get_brainstorm_session', { id })
}

// =============================================================================
// Key Insight Commands
// =============================================================================

export async function createKeyInsight(
  projectId: string,
  deckId: string,
  title: string,
  reportPath: string,
): Promise<KeyInsight> {
  return invoke<KeyInsight>('create_key_insight', { projectId, deckId, title, reportPath })
}

export async function listKeyInsights(deckId: string): Promise<KeyInsight[]> {
  return invoke<KeyInsight[]>('list_key_insights', { deckId })
}

export async function deleteKeyInsight(id: string): Promise<void> {
  return invoke<void>('delete_key_insight', { id })
}

// =============================================================================
// Plan Commands
// =============================================================================

export interface PlanWithProgress {
  id: string
  deckId: string
  name: string
  reportPath?: string
  planPath?: string
  createdAt: string
  updatedAt: string
  totalPhases: number
  donePhases: number
}

export interface PlanWithPhases {
  plan: {
    id: string
    deckId: string
    name: string
    reportPath?: string
    planPath?: string
    createdAt: string
    updatedAt: string
  }
  phases: Array<{
    id: string
    planId: string
    name: string
    description?: string
    filePath?: string
    orderIndex: number
    status: string
    createdAt: string
    updatedAt: string
  }>
}

export interface PhaseInput {
  name: string
  description?: string
  filePath?: string
  orderIndex: number
}

export async function createPlan(
  deckId: string,
  name: string,
  planPath?: string,
  reportPath?: string,
): Promise<{ id: string; deckId: string; name: string; createdAt: string }> {
  return invoke('create_plan', { deckId, name, planPath, reportPath })
}

export async function createPhases(
  planId: string,
  phases: PhaseInput[],
): Promise<PlanWithPhases['phases']> {
  return invoke('create_phases', { planId, phases })
}

export async function listPlansDb(deckId: string): Promise<PlanWithProgress[]> {
  return invoke<PlanWithProgress[]>('list_plans', { deckId })
}

export async function getPlan(id: string): Promise<PlanWithPhases | null> {
  return invoke<PlanWithPhases | null>('get_plan', { id })
}

export async function updatePhaseStatus(phaseId: string, done: boolean): Promise<void> {
  return invoke<void>('update_phase_status', { phaseId, done })
}

export async function readPlanFile(path: string): Promise<string> {
  return invoke<string>('read_plan_file', { path })
}

// =============================================================================
// Subagent Commands
// =============================================================================

/** List subagent JSONL files in a session's subagents directory */
export async function listSubagentFiles(sessionDir: string): Promise<string[]> {
  return invoke<string[]>('list_subagent_files', { sessionDir })
}

/** Parse a single subagent JSONL file */
export async function parseSubagentFile(filePath: string): Promise<RawSubagentData> {
  return invoke<RawSubagentData>('parse_subagent_file', { filePath })
}

/** Resolve all subagents for a session directory */
export async function resolveSubagents(sessionDir: string): Promise<RawSubagentData[]> {
  return invoke<RawSubagentData[]>('resolve_subagents', { sessionDir })
}
