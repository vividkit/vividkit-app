use std::path::PathBuf;

use r2d2::{CustomizeConnection, Pool, PooledConnection};
use r2d2_sqlite::SqliteConnectionManager;
use rusqlite::Connection;

pub mod migrations;

const DB_FILE_NAME: &str = "vividkit.db";

#[derive(Clone)]
pub struct DbState {
    pool: Pool<SqliteConnectionManager>,
}

impl DbState {
    pub fn new(pool: Pool<SqliteConnectionManager>) -> Self {
        Self { pool }
    }

    pub fn pool(&self) -> &Pool<SqliteConnectionManager> {
        &self.pool
    }

    pub fn get_conn(&self) -> Result<PooledConnection<SqliteConnectionManager>, String> {
        self.pool.get().map_err(|e| e.to_string())
    }
}

#[derive(Debug)]
struct SqlitePragmaCustomizer;

impl CustomizeConnection<Connection, rusqlite::Error> for SqlitePragmaCustomizer {
    fn on_acquire(&self, conn: &mut Connection) -> Result<(), rusqlite::Error> {
        conn.execute_batch(
            "PRAGMA foreign_keys = ON;
             PRAGMA journal_mode = WAL;",
        )?;

        Ok(())
    }
}

pub fn init_db(app_data_dir: PathBuf) -> Result<DbState, String> {
    std::fs::create_dir_all(&app_data_dir).map_err(|e| e.to_string())?;

    let db_path = app_data_dir.join(DB_FILE_NAME);
    let manager = SqliteConnectionManager::file(db_path);

    let pool = Pool::builder()
        .max_size(8)
        .connection_customizer(Box::new(SqlitePragmaCustomizer))
        .build(manager)
        .map_err(|e| e.to_string())?;

    let conn = pool.get().map_err(|e| e.to_string())?;
    migrations::run_migrations(&conn)?;

    Ok(DbState::new(pool))
}
