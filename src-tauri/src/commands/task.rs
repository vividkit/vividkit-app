use rusqlite::{params, Connection, OptionalExtension};
use tauri::State;
use uuid::Uuid;

use crate::db::DbState;
use crate::models::task::{to_task, Task, TaskPriority, TaskRow, TaskStatus, TaskType};

fn fetch_task(conn: &Connection, id: &str) -> Result<Task, String> {
    let row = conn
        .query_row(
            "SELECT id, deck_id, type, name, description, status, priority, plan_id, phase_id, worktree_name
             FROM tasks WHERE id = ?1",
            [id],
            |row| {
                Ok((
                    row.get(0)?,
                    row.get(1)?,
                    row.get(2)?,
                    row.get(3)?,
                    row.get(4)?,
                    row.get(5)?,
                    row.get(6)?,
                    row.get(7)?,
                    row.get(8)?,
                    row.get(9)?,
                ))
            },
        )
        .optional()
        .map_err(|e| e.to_string())?;

    to_task(row.ok_or_else(|| format!("Task not found: {id}"))?)
}

#[tauri::command]
pub fn create_task(
    db: State<'_, DbState>,
    deck_id: String,
    name: String,
    description: Option<String>,
    priority: Option<TaskPriority>,
    r#type: Option<TaskType>,
) -> Result<Task, String> {
    let conn = db.get_conn()?;
    let id = Uuid::new_v4().to_string();

    conn.execute(
        "INSERT INTO tasks (id, deck_id, type, name, description, status, priority, plan_id, phase_id, worktree_name)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, NULL, NULL, NULL)",
        params![
            id,
            deck_id,
            r#type.unwrap_or(TaskType::Custom).as_db_str(),
            name,
            description,
            TaskStatus::Backlog.as_db_str(),
            priority.unwrap_or(TaskPriority::Medium).as_db_str(),
        ],
    )
    .map_err(|e| e.to_string())?;

    fetch_task(&conn, &id)
}

#[tauri::command]
pub fn list_tasks(db: State<'_, DbState>, deck_id: String) -> Result<Vec<Task>, String> {
    let conn = db.get_conn()?;
    let mut stmt = conn
        .prepare(
            "SELECT id, deck_id, type, name, description, status, priority, plan_id, phase_id, worktree_name
             FROM tasks WHERE deck_id = ?1 ORDER BY rowid DESC",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([deck_id], |row| {
            Ok::<TaskRow, rusqlite::Error>((
                row.get(0)?,
                row.get(1)?,
                row.get(2)?,
                row.get(3)?,
                row.get(4)?,
                row.get(5)?,
                row.get(6)?,
                row.get(7)?,
                row.get(8)?,
                row.get(9)?,
            ))
        })
        .map_err(|e| e.to_string())?;

    rows.map(|row| row.map_err(|e| e.to_string()).and_then(to_task))
        .collect::<Result<Vec<_>, _>>()
}

#[tauri::command]
pub fn get_task(db: State<'_, DbState>, id: String) -> Result<Task, String> {
    let conn = db.get_conn()?;
    fetch_task(&conn, &id)
}

#[tauri::command]
pub fn update_task(
    db: State<'_, DbState>,
    id: String,
    name: Option<String>,
    description: Option<String>,
    priority: Option<TaskPriority>,
    status: Option<TaskStatus>,
) -> Result<Task, String> {
    let conn = db.get_conn()?;
    let current = fetch_task(&conn, &id)?;

    conn.execute(
        "UPDATE tasks SET name = ?1, description = ?2, priority = ?3, status = ?4 WHERE id = ?5",
        params![
            name.unwrap_or(current.name),
            description.or(current.description),
            priority.unwrap_or(current.priority).as_db_str(),
            status.unwrap_or(current.status).as_db_str(),
            id,
        ],
    )
    .map_err(|e| e.to_string())?;

    fetch_task(&conn, &id)
}

#[tauri::command]
pub fn update_task_status(
    db: State<'_, DbState>,
    id: String,
    status: TaskStatus,
) -> Result<Task, String> {
    let conn = db.get_conn()?;

    if conn
        .execute(
            "UPDATE tasks SET status = ?1 WHERE id = ?2",
            params![status.as_db_str(), &id],
        )
        .map_err(|e| e.to_string())?
        == 0
    {
        return Err(format!("Task not found: {id}"));
    }

    fetch_task(&conn, &id)
}

#[tauri::command]
pub fn delete_task(db: State<'_, DbState>, id: String) -> Result<(), String> {
    let conn = db.get_conn()?;
    if conn
        .execute("DELETE FROM tasks WHERE id = ?1", [id.clone()])
        .map_err(|e| e.to_string())?
        == 0
    {
        return Err(format!("Task not found: {id}"));
    }
    Ok(())
}
