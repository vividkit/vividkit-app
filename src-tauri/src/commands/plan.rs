use std::collections::HashMap;

use rusqlite::{params, Connection, OptionalExtension};
use tauri::State;
use uuid::Uuid;

use crate::db::DbState;
use crate::models::plan::{to_phase, Phase, PhaseStatus, Plan};

fn now_iso8601(conn: &Connection) -> Result<String, String> {
    conn.query_row("SELECT strftime('%Y-%m-%dT%H:%M:%fZ','now')", [], |row| {
        row.get(0)
    })
    .map_err(|e| e.to_string())
}

fn fetch_phase(conn: &Connection, id: &str) -> Result<Phase, String> {
    let row = conn
        .query_row(
            "SELECT id, plan_id, name, description, file_path, sort_order, status FROM phases WHERE id = ?1",
            [id],
            |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?, r.get(3)?, r.get(4)?, r.get(5)?, r.get(6)?)),
        )
        .optional()
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Phase not found: {id}"))?;
    to_phase(row)
}

fn load_plan(conn: &Connection, id: &str) -> Result<Plan, String> {
    let plan_row = conn
        .query_row(
            "SELECT id, deck_id, name, report_path, plan_path, created_at FROM plans WHERE id = ?1",
            [id],
            |r| {
                Ok((
                    r.get(0)?,
                    r.get(1)?,
                    r.get(2)?,
                    r.get(3)?,
                    r.get(4)?,
                    r.get(5)?,
                ))
            },
        )
        .optional()
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Plan not found: {id}"))?;

    let mut stmt = conn
        .prepare(
            "SELECT id, plan_id, name, description, file_path, sort_order, status
             FROM phases WHERE plan_id = ?1 ORDER BY sort_order ASC, rowid ASC",
        )
        .map_err(|e| e.to_string())?;
    let phase_rows = stmt
        .query_map([id], |r| {
            Ok((
                r.get(0)?,
                r.get(1)?,
                r.get(2)?,
                r.get(3)?,
                r.get(4)?,
                r.get(5)?,
                r.get(6)?,
            ))
        })
        .map_err(|e| e.to_string())?;

    let phases = phase_rows
        .map(|row| row.map_err(|e| e.to_string()).and_then(to_phase))
        .collect::<Result<Vec<_>, _>>()?;

    Ok(Plan {
        id: plan_row.0,
        deck_id: plan_row.1,
        name: plan_row.2,
        report_path: plan_row.3,
        plan_path: plan_row.4,
        phases,
        created_at: plan_row.5,
    })
}

#[tauri::command]
pub fn create_plan(
    db: State<'_, DbState>,
    deck_id: String,
    name: String,
    report_path: Option<String>,
    plan_path: Option<String>,
) -> Result<Plan, String> {
    let conn = db.get_conn()?;
    let id = Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO plans (id, deck_id, name, report_path, plan_path, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![id, deck_id, name, report_path, plan_path, now_iso8601(&conn)?],
    )
    .map_err(|e| e.to_string())?;
    load_plan(&conn, &id)
}

#[tauri::command]
pub fn list_plans(db: State<'_, DbState>, deck_id: String) -> Result<Vec<Plan>, String> {
    let conn = db.get_conn()?;
    let mut plans = Vec::new();

    let mut plan_stmt = conn
        .prepare("SELECT id, deck_id, name, report_path, plan_path, created_at FROM plans WHERE deck_id = ?1 ORDER BY created_at DESC")
        .map_err(|e| e.to_string())?;
    let mut plan_rows = plan_stmt.query([&deck_id]).map_err(|e| e.to_string())?;

    while let Some(r) = plan_rows.next().map_err(|e| e.to_string())? {
        plans.push(Plan {
            id: r.get(0).map_err(|e| e.to_string())?,
            deck_id: r.get(1).map_err(|e| e.to_string())?,
            name: r.get(2).map_err(|e| e.to_string())?,
            report_path: r.get(3).map_err(|e| e.to_string())?,
            plan_path: r.get(4).map_err(|e| e.to_string())?,
            phases: Vec::new(),
            created_at: r.get(5).map_err(|e| e.to_string())?,
        });
    }

    let mut grouped: HashMap<String, Vec<Phase>> = HashMap::new();
    let mut phase_stmt = conn
        .prepare(
            "SELECT ph.id, ph.plan_id, ph.name, ph.description, ph.file_path, ph.sort_order, ph.status
             FROM phases ph INNER JOIN plans p ON p.id = ph.plan_id
             WHERE p.deck_id = ?1 ORDER BY ph.sort_order ASC, ph.rowid ASC",
        )
        .map_err(|e| e.to_string())?;

    let phase_rows = phase_stmt
        .query_map([&deck_id], |r| {
            Ok((
                r.get(0)?,
                r.get(1)?,
                r.get(2)?,
                r.get(3)?,
                r.get(4)?,
                r.get(5)?,
                r.get(6)?,
            ))
        })
        .map_err(|e| e.to_string())?;

    for row in phase_rows {
        let phase = to_phase(row.map_err(|e| e.to_string())?)?;
        grouped
            .entry(phase.plan_id.clone())
            .or_default()
            .push(phase);
    }

    for plan in &mut plans {
        plan.phases = grouped.remove(&plan.id).unwrap_or_default();
    }

    Ok(plans)
}

#[tauri::command]
pub fn get_plan(db: State<'_, DbState>, id: String) -> Result<Plan, String> {
    let conn = db.get_conn()?;
    load_plan(&conn, &id)
}

#[tauri::command]
pub fn delete_plan(db: State<'_, DbState>, id: String) -> Result<(), String> {
    let conn = db.get_conn()?;
    if conn
        .execute("DELETE FROM plans WHERE id = ?1", [id.clone()])
        .map_err(|e| e.to_string())?
        == 0
    {
        return Err(format!("Plan not found: {id}"));
    }
    Ok(())
}

#[tauri::command]
pub fn create_phase(
    db: State<'_, DbState>,
    plan_id: String,
    name: String,
    description: Option<String>,
    file_path: Option<String>,
    order: i64,
) -> Result<Phase, String> {
    let conn = db.get_conn()?;
    let id = Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO phases (id, plan_id, name, description, file_path, sort_order, status) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![id, plan_id, name, description, file_path, order, PhaseStatus::Pending.as_db_str()],
    )
    .map_err(|e| e.to_string())?;
    fetch_phase(&conn, &id)
}

#[tauri::command]
pub fn update_phase_status(
    db: State<'_, DbState>,
    id: String,
    status: PhaseStatus,
) -> Result<Phase, String> {
    let conn = db.get_conn()?;
    if conn
        .execute(
            "UPDATE phases SET status = ?1 WHERE id = ?2",
            params![status.as_db_str(), &id],
        )
        .map_err(|e| e.to_string())?
        == 0
    {
        return Err(format!("Phase not found: {id}"));
    }
    fetch_phase(&conn, &id)
}

#[tauri::command]
pub fn delete_phase(db: State<'_, DbState>, id: String) -> Result<(), String> {
    let conn = db.get_conn()?;
    if conn
        .execute("DELETE FROM phases WHERE id = ?1", [id.clone()])
        .map_err(|e| e.to_string())?
        == 0
    {
        return Err(format!("Phase not found: {id}"));
    }
    Ok(())
}
