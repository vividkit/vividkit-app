use crate::db::DbState;
use crate::models::plan::{Phase, PhaseStatus, Plan};
use serde::Deserialize;
use tauri::State;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PhaseInput {
    pub name: String,
    pub description: Option<String>,
    pub file_path: Option<String>,
    pub order_index: i32,
}

#[tauri::command]
pub fn create_plan(
    db: State<'_, DbState>,
    deck_id: String,
    name: String,
    plan_path: Option<String>,
    report_path: Option<String>,
) -> Result<Plan, String> {
    let conn = db.conn.lock().map_err(|e| format!("lock db: {e}"))?;
    let now = chrono::Utc::now().to_rfc3339();
    let id = uuid::Uuid::new_v4().to_string();

    conn.execute(
        "INSERT INTO plans (id, deck_id, name, plan_path, report_path, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?6)",
        rusqlite::params![id, deck_id, name, plan_path, report_path, now],
    )
    .map_err(|e| format!("insert plan: {e}"))?;

    Ok(Plan {
        id,
        deck_id,
        name,
        report_path,
        plan_path,
        created_at: now.clone(),
        updated_at: now,
    })
}

#[tauri::command]
pub fn create_phases(
    db: State<'_, DbState>,
    plan_id: String,
    phases: Vec<PhaseInput>,
) -> Result<Vec<Phase>, String> {
    let conn = db.conn.lock().map_err(|e| format!("lock db: {e}"))?;
    let now = chrono::Utc::now().to_rfc3339();
    let mut result = Vec::new();

    for input in phases {
        let id = uuid::Uuid::new_v4().to_string();
        conn.execute(
            "INSERT INTO phases (id, plan_id, name, description, file_path, order_index, status, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'pending', ?7, ?7)",
            rusqlite::params![id, plan_id, input.name, input.description, input.file_path, input.order_index, now],
        )
        .map_err(|e| format!("insert phase: {e}"))?;

        result.push(Phase {
            id,
            plan_id: plan_id.clone(),
            name: input.name,
            description: input.description,
            file_path: input.file_path,
            order_index: input.order_index,
            status: PhaseStatus::Pending,
            created_at: now.clone(),
            updated_at: now.clone(),
        });
    }

    Ok(result)
}

/// List plans for a deck, with phase count summary
#[tauri::command]
pub fn list_plans(
    db: State<'_, DbState>,
    deck_id: String,
) -> Result<Vec<PlanWithProgress>, String> {
    let conn = db.conn.lock().map_err(|e| format!("lock db: {e}"))?;
    let mut stmt = conn
        .prepare(
            "SELECT p.id, p.deck_id, p.name, p.report_path, p.plan_path, p.created_at, p.updated_at,
                    COUNT(ph.id) as total_phases,
                    SUM(CASE WHEN ph.status = 'done' THEN 1 ELSE 0 END) as done_phases
             FROM plans p
             LEFT JOIN phases ph ON ph.plan_id = p.id
             WHERE p.deck_id = ?1
             GROUP BY p.id
             ORDER BY p.created_at DESC",
        )
        .map_err(|e| format!("prepare: {e}"))?;

    let rows = stmt
        .query_map([&deck_id], |row| {
            Ok(PlanWithProgress {
                id: row.get(0)?,
                deck_id: row.get(1)?,
                name: row.get(2)?,
                report_path: row.get(3)?,
                plan_path: row.get(4)?,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
                total_phases: row.get(7)?,
                done_phases: row.get(8)?,
            })
        })
        .map_err(|e| format!("query: {e}"))?;

    let mut plans = Vec::new();
    for row in rows {
        plans.push(row.map_err(|e| format!("row: {e}"))?);
    }
    Ok(plans)
}

/// Get a single plan with all its phases
#[tauri::command]
pub fn get_plan(
    db: State<'_, DbState>,
    id: String,
) -> Result<Option<PlanWithPhases>, String> {
    let conn = db.conn.lock().map_err(|e| format!("lock db: {e}"))?;

    let plan = conn
        .query_row(
            "SELECT id, deck_id, name, report_path, plan_path, created_at, updated_at
             FROM plans WHERE id = ?1",
            [&id],
            |row| {
                Ok(Plan {
                    id: row.get(0)?,
                    deck_id: row.get(1)?,
                    name: row.get(2)?,
                    report_path: row.get(3)?,
                    plan_path: row.get(4)?,
                    created_at: row.get(5)?,
                    updated_at: row.get(6)?,
                })
            },
        )
        .ok();

    let Some(plan) = plan else { return Ok(None) };

    let mut stmt = conn
        .prepare(
            "SELECT id, plan_id, name, description, file_path, order_index, status, created_at, updated_at
             FROM phases WHERE plan_id = ?1 ORDER BY order_index ASC",
        )
        .map_err(|e| format!("prepare phases: {e}"))?;

    let phase_rows = stmt
        .query_map([&plan.id], |row| {
            Ok(Phase {
                id: row.get(0)?,
                plan_id: row.get(1)?,
                name: row.get(2)?,
                description: row.get(3)?,
                file_path: row.get(4)?,
                order_index: row.get(5)?,
                status: parse_phase_status(&row.get::<_, String>(6)?),
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        })
        .map_err(|e| format!("query phases: {e}"))?;

    let mut phases = Vec::new();
    for row in phase_rows {
        phases.push(row.map_err(|e| format!("row: {e}"))?);
    }

    Ok(Some(PlanWithPhases { plan, phases }))
}

#[tauri::command]
pub fn update_phase_status(
    db: State<'_, DbState>,
    phase_id: String,
    done: bool,
) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| format!("lock db: {e}"))?;
    let now = chrono::Utc::now().to_rfc3339();
    let status = if done { "done" } else { "pending" };

    conn.execute(
        "UPDATE phases SET status = ?1, updated_at = ?2 WHERE id = ?3",
        rusqlite::params![status, now, phase_id],
    )
    .map_err(|e| format!("update phase status: {e}"))?;

    Ok(())
}

/// Read plan.md file content from disk
#[tauri::command]
pub fn read_plan_file(path: String) -> Result<String, String> {
    std::fs::read_to_string(&path).map_err(|e| format!("read plan file: {e}"))
}

// --- Response types ---

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PlanWithProgress {
    pub id: String,
    pub deck_id: String,
    pub name: String,
    pub report_path: Option<String>,
    pub plan_path: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub total_phases: i64,
    pub done_phases: i64,
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PlanWithPhases {
    pub plan: Plan,
    pub phases: Vec<Phase>,
}

fn parse_phase_status(s: &str) -> PhaseStatus {
    match s {
        "in_progress" => PhaseStatus::InProgress,
        "done" => PhaseStatus::Done,
        _ => PhaseStatus::Pending,
    }
}
