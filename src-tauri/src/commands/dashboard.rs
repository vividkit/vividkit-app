use crate::db::DbState;
use serde::Serialize;
use tauri::State;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DashboardStats {
    pub active_tasks: i64,
    pub total_tasks: i64,
    pub done_tasks: i64,
    pub worktree_count: i64,
    pub brainstorm_count: i64,
}

#[tauri::command]
pub fn get_dashboard_stats(
    db: State<'_, DbState>,
    deck_id: Option<String>,
    project_id: Option<String>,
) -> Result<DashboardStats, String> {
    let conn = db.conn.lock().map_err(|e| format!("lock db: {e}"))?;

    let (total_tasks, active_tasks, done_tasks) = if let Some(ref did) = deck_id {
        let total: i64 = conn
            .query_row("SELECT COUNT(*) FROM tasks WHERE deck_id = ?1", [did], |r| r.get(0))
            .map_err(|e| format!("count tasks: {e}"))?;
        let active: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM tasks WHERE deck_id = ?1 AND status = 'in_progress'",
                [did],
                |r| r.get(0),
            )
            .map_err(|e| format!("count active: {e}"))?;
        let done: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM tasks WHERE deck_id = ?1 AND status = 'done'",
                [did],
                |r| r.get(0),
            )
            .map_err(|e| format!("count done: {e}"))?;
        (total, active, done)
    } else {
        (0, 0, 0)
    };

    let worktree_count = if let Some(ref pid) = project_id {
        conn.query_row(
            "SELECT COUNT(*) FROM worktrees WHERE project_id = ?1",
            [pid],
            |r| r.get(0),
        )
        .map_err(|e| format!("count worktrees: {e}"))?
    } else {
        0
    };

    let brainstorm_count = if let Some(ref did) = deck_id {
        conn.query_row(
            "SELECT COUNT(*) FROM brainstorm_sessions WHERE deck_id = ?1",
            [did],
            |r| r.get(0),
        )
        .map_err(|e| format!("count brainstorms: {e}"))?
    } else {
        0
    };

    Ok(DashboardStats {
        active_tasks,
        total_tasks,
        done_tasks,
        worktree_count,
        brainstorm_count,
    })
}
