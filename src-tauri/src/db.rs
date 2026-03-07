use rusqlite::Connection;
use std::path::PathBuf;
use std::sync::Mutex;

/// Managed state holding the SQLite connection
pub struct DbState {
    pub conn: Mutex<Connection>,
}

/// Open SQLite at `app_data_dir/vividkit.db`, enable WAL, run migrations
pub fn init_database(app_data_dir: PathBuf) -> Result<DbState, String> {
    std::fs::create_dir_all(&app_data_dir).map_err(|e| format!("create app data dir: {e}"))?;

    let db_path = app_data_dir.join("vividkit.db");
    let conn = Connection::open(&db_path).map_err(|e| format!("open db: {e}"))?;

    // Enable WAL mode for concurrent reads
    conn.execute_batch("PRAGMA journal_mode=WAL;")
        .map_err(|e| format!("WAL pragma: {e}"))?;

    // Enable foreign keys
    conn.execute_batch("PRAGMA foreign_keys=ON;")
        .map_err(|e| format!("FK pragma: {e}"))?;

    // Create schema_version table
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS schema_version (
            version INTEGER PRIMARY KEY,
            applied_at TEXT NOT NULL DEFAULT (datetime('now'))
        );",
    )
    .map_err(|e| format!("schema_version table: {e}"))?;

    // Run pending migrations
    run_migrations(&conn)?;

    Ok(DbState {
        conn: Mutex::new(conn),
    })
}

/// Apply migrations that haven't been applied yet
fn run_migrations(conn: &Connection) -> Result<(), String> {
    let current_version: i64 = conn
        .query_row(
            "SELECT COALESCE(MAX(version), 0) FROM schema_version",
            [],
            |row| row.get(0),
        )
        .map_err(|e| format!("read schema version: {e}"))?;

    let migrations: Vec<(i64, &str)> = vec![(
        1,
        include_str!("../migrations/001_initial_schema.sql"),
    )];

    for (version, sql) in migrations {
        if version > current_version {
            conn.execute_batch(sql)
                .map_err(|e| format!("migration v{version}: {e}"))?;
            conn.execute(
                "INSERT INTO schema_version (version) VALUES (?1)",
                [version],
            )
            .map_err(|e| format!("record migration v{version}: {e}"))?;
        }
    }

    Ok(())
}
