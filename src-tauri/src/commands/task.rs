use crate::db::DbState;
use crate::models::task::{Task, TaskPriority, TaskStatus, TaskType};
use tauri::State;

fn parse_task_status(s: &str) -> TaskStatus {
    match s {
        "backlog" => TaskStatus::Backlog,
        "todo" => TaskStatus::Todo,
        "cooking" => TaskStatus::Cooking,
        "paused" => TaskStatus::Paused,
        "review" => TaskStatus::Review,
        "done" => TaskStatus::Done,
        "failed" => TaskStatus::Failed,
        _ => TaskStatus::Backlog,
    }
}

fn status_str(s: &TaskStatus) -> &'static str {
    match s {
        TaskStatus::Backlog => "backlog",
        TaskStatus::Todo => "todo",
        TaskStatus::Cooking => "cooking",
        TaskStatus::Paused => "paused",
        TaskStatus::Review => "review",
        TaskStatus::Done => "done",
        TaskStatus::Failed => "failed",
    }
}

fn parse_task_priority(s: &str) -> TaskPriority {
    match s {
        "low" => TaskPriority::Low,
        "high" => TaskPriority::High,
        _ => TaskPriority::Medium,
    }
}

fn parse_task_type(s: &str) -> TaskType {
    match s {
        "generated" => TaskType::Generated,
        _ => TaskType::Custom,
    }
}

fn validate_status_transition(from: &TaskStatus, to: &TaskStatus) -> Result<(), String> {
    let allowed = match from {
        TaskStatus::Backlog => vec![TaskStatus::Todo],
        TaskStatus::Todo => vec![TaskStatus::Cooking, TaskStatus::Backlog],
        TaskStatus::Cooking => vec![TaskStatus::Paused, TaskStatus::Review, TaskStatus::Failed],
        TaskStatus::Paused => vec![TaskStatus::Cooking, TaskStatus::Todo],
        TaskStatus::Review => vec![TaskStatus::Done, TaskStatus::Cooking],
        TaskStatus::Failed => vec![TaskStatus::Todo],
        TaskStatus::Done => vec![],
    };
    if allowed.contains(to) {
        Ok(())
    } else {
        Err(format!(
            "invalid status transition: {} -> {}",
            status_str(from),
            status_str(to)
        ))
    }
}

fn row_to_task(row: &rusqlite::Row) -> rusqlite::Result<Task> {
    Ok(Task {
        id: row.get(0)?,
        deck_id: row.get(1)?,
        task_type: parse_task_type(&row.get::<_, String>(2)?),
        name: row.get(3)?,
        description: row.get(4)?,
        status: parse_task_status(&row.get::<_, String>(5)?),
        priority: parse_task_priority(&row.get::<_, String>(6)?),
        plan_id: row.get(7)?,
        phase_id: row.get(8)?,
        worktree_id: row.get(9)?,
        cook_session_id: row.get(10)?,
        created_at: row.get(11)?,
        updated_at: row.get(12)?,
    })
}

#[tauri::command]
pub fn create_task(
    db: State<'_, DbState>,
    deck_id: String,
    name: String,
    priority: String,
    task_type: String,
    description: Option<String>,
    plan_id: Option<String>,
    phase_id: Option<String>,
) -> Result<Task, String> {
    let conn = db.conn.lock().map_err(|e| format!("lock db: {e}"))?;
    let now = chrono::Utc::now().to_rfc3339();
    let id = uuid::Uuid::new_v4().to_string();
    let ttype = parse_task_type(&task_type);
    let status = match ttype {
        TaskType::Generated => "backlog",
        TaskType::Custom => "todo",
    };

    conn.execute(
        "INSERT INTO tasks (id, deck_id, task_type, name, description, status, priority, plan_id, phase_id, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?10)",
        rusqlite::params![id, deck_id, task_type, name, description, status, priority, plan_id, phase_id, now],
    )
    .map_err(|e| format!("insert task: {e}"))?;

    Ok(Task {
        id,
        deck_id,
        task_type: ttype,
        name,
        description,
        status: parse_task_status(status),
        priority: parse_task_priority(&priority),
        plan_id,
        phase_id,
        worktree_id: None,
        cook_session_id: None,
        created_at: now.clone(),
        updated_at: now,
    })
}

#[tauri::command]
pub fn list_tasks(db: State<'_, DbState>, deck_id: String) -> Result<Vec<Task>, String> {
    let conn = db.conn.lock().map_err(|e| format!("lock db: {e}"))?;
    let mut stmt = conn
        .prepare(
            "SELECT id, deck_id, task_type, name, description, status, priority, plan_id, phase_id, worktree_id, cook_session_id, created_at, updated_at
             FROM tasks WHERE deck_id = ?1 ORDER BY created_at DESC",
        )
        .map_err(|e| format!("prepare: {e}"))?;

    let rows = stmt
        .query_map([&deck_id], row_to_task)
        .map_err(|e| format!("query: {e}"))?;

    let mut tasks = Vec::new();
    for row in rows {
        tasks.push(row.map_err(|e| format!("row: {e}"))?);
    }
    Ok(tasks)
}

#[tauri::command]
pub fn get_task(db: State<'_, DbState>, id: String) -> Result<Option<Task>, String> {
    let conn = db.conn.lock().map_err(|e| format!("lock db: {e}"))?;
    let result = conn
        .query_row(
            "SELECT id, deck_id, task_type, name, description, status, priority, plan_id, phase_id, worktree_id, cook_session_id, created_at, updated_at
             FROM tasks WHERE id = ?1",
            [&id],
            row_to_task,
        )
        .ok();
    Ok(result)
}

#[tauri::command]
pub fn update_task(
    db: State<'_, DbState>,
    id: String,
    name: Option<String>,
    description: Option<String>,
    priority: Option<String>,
) -> Result<Task, String> {
    let conn = db.conn.lock().map_err(|e| format!("lock db: {e}"))?;
    let now = chrono::Utc::now().to_rfc3339();

    let mut sets = vec!["updated_at = ?1".to_string()];
    let mut param_idx = 2u32;
    let mut params: Vec<Box<dyn rusqlite::types::ToSql>> = vec![Box::new(now)];

    if let Some(ref v) = name {
        sets.push(format!("name = ?{param_idx}"));
        params.push(Box::new(v.clone()));
        param_idx += 1;
    }
    if let Some(ref v) = description {
        sets.push(format!("description = ?{param_idx}"));
        params.push(Box::new(v.clone()));
        param_idx += 1;
    }
    if let Some(ref v) = priority {
        sets.push(format!("priority = ?{param_idx}"));
        params.push(Box::new(v.clone()));
        param_idx += 1;
    }

    let sql = format!("UPDATE tasks SET {} WHERE id = ?{param_idx}", sets.join(", "));
    params.push(Box::new(id.clone()));

    let param_refs: Vec<&dyn rusqlite::types::ToSql> = params.iter().map(|p| p.as_ref()).collect();
    conn.execute(&sql, param_refs.as_slice())
        .map_err(|e| format!("update task: {e}"))?;

    let task = conn
        .query_row(
            "SELECT id, deck_id, task_type, name, description, status, priority, plan_id, phase_id, worktree_id, cook_session_id, created_at, updated_at
             FROM tasks WHERE id = ?1",
            [&id],
            row_to_task,
        )
        .map_err(|e| format!("fetch updated task: {e}"))?;

    Ok(task)
}

#[tauri::command]
pub fn delete_task(db: State<'_, DbState>, id: String) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| format!("lock db: {e}"))?;
    conn.execute("DELETE FROM tasks WHERE id = ?1", [&id])
        .map_err(|e| format!("delete task: {e}"))?;
    Ok(())
}

#[tauri::command]
pub fn update_task_status(
    db: State<'_, DbState>,
    id: String,
    new_status: String,
) -> Result<Task, String> {
    let conn = db.conn.lock().map_err(|e| format!("lock db: {e}"))?;

    let current_status_str: String = conn
        .query_row("SELECT status FROM tasks WHERE id = ?1", [&id], |r| r.get(0))
        .map_err(|e| format!("fetch task status: {e}"))?;

    let from = parse_task_status(&current_status_str);
    let to = parse_task_status(&new_status);
    validate_status_transition(&from, &to)?;

    let now = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "UPDATE tasks SET status = ?1, updated_at = ?2 WHERE id = ?3",
        rusqlite::params![new_status, now, id],
    )
    .map_err(|e| format!("update task status: {e}"))?;

    let task = conn
        .query_row(
            "SELECT id, deck_id, task_type, name, description, status, priority, plan_id, phase_id, worktree_id, cook_session_id, created_at, updated_at
             FROM tasks WHERE id = ?1",
            [&id],
            row_to_task,
        )
        .map_err(|e| format!("fetch updated task: {e}"))?;

    Ok(task)
}
