use std::path::PathBuf;

use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CcsProfile {
    pub name: String,
    pub profile_type: String,
}

fn ccs_root_dir() -> Result<PathBuf, String> {
    std::env::var_os("HOME")
        .or_else(|| std::env::var_os("USERPROFILE"))
        .map(PathBuf::from)
        .map(|home| home.join(".ccs"))
        .ok_or_else(|| "Unable to resolve home directory".to_string())
}

fn parse_yaml_profiles(config_yaml: &str) -> Vec<String> {
    let mut names = Vec::new();
    let mut in_profiles = false;
    let mut profiles_indent = 0usize;
    let mut child_indent: Option<usize> = None;

    for line in config_yaml.lines() {
        let trimmed_end = line.trim_end();
        if trimmed_end.trim().is_empty() || trimmed_end.trim_start().starts_with('#') {
            continue;
        }

        let indent = trimmed_end
            .chars()
            .take_while(|c| c.is_whitespace())
            .count();
        let trimmed = trimmed_end.trim_start();

        if !in_profiles {
            if trimmed.starts_with("profiles:") {
                in_profiles = true;
                profiles_indent = indent;
            }
            continue;
        }

        if indent <= profiles_indent {
            break;
        }

        if child_indent.is_none() && trimmed.ends_with(':') {
            child_indent = Some(indent);
        }

        if Some(indent) != child_indent || !trimmed.ends_with(':') {
            continue;
        }

        if let Some((key, _)) = trimmed.split_once(':') {
            let key_trimmed = key.trim();
            if !key_trimmed.is_empty() {
                names.push(key_trimmed.to_string());
            }
        }
    }

    names
}

fn profile_name_from_settings_file(path: &PathBuf) -> Option<String> {
    let file_name = path.file_name()?.to_str()?;
    file_name
        .strip_suffix(".settings.json")
        .map(|s| s.to_string())
        .filter(|s| !s.is_empty())
}

fn profile_name_from_instance(path: &PathBuf) -> Option<String> {
    if path.is_file() {
        let file_name = path.file_name()?.to_str()?;
        if file_name.ends_with(".json") {
            return file_name
                .strip_suffix(".json")
                .map(|s| s.to_string())
                .filter(|s| !s.is_empty());
        }
    }

    if path.is_dir() {
        return path
            .file_name()
            .and_then(|n| n.to_str())
            .map(|s| s.to_string())
            .filter(|s| !s.is_empty());
    }

    None
}

#[tauri::command]
pub fn list_ccs_profiles() -> Result<Vec<CcsProfile>, String> {
    let root = ccs_root_dir()?;
    if !root.exists() {
        return Ok(Vec::new());
    }

    let mut profiles = std::collections::HashMap::<String, String>::new();

    let config_yaml_path = root.join("config.yaml");
    if config_yaml_path.is_file() {
        let content = std::fs::read_to_string(config_yaml_path).map_err(|e| e.to_string())?;
        for name in parse_yaml_profiles(&content) {
            profiles.entry(name).or_insert_with(|| "yaml".to_string());
        }
    }

    let root_entries = std::fs::read_dir(&root).map_err(|e| e.to_string())?;
    for entry in root_entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        if let Some(name) = profile_name_from_settings_file(&path) {
            profiles
                .entry(name)
                .or_insert_with(|| "settings".to_string());
        }
    }

    let instances_dir = root.join("instances");
    if instances_dir.is_dir() {
        let instance_entries = std::fs::read_dir(instances_dir).map_err(|e| e.to_string())?;
        for entry in instance_entries {
            let entry = entry.map_err(|e| e.to_string())?;
            let path = entry.path();
            if let Some(name) = profile_name_from_instance(&path) {
                profiles.entry(name).or_insert_with(|| "oauth".to_string());
            }
        }
    }

    let mut result: Vec<CcsProfile> = profiles
        .into_iter()
        .map(|(name, profile_type)| CcsProfile { name, profile_type })
        .collect();
    result.sort_by(|a, b| a.name.cmp(&b.name));

    Ok(result)
}
