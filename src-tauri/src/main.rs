// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
struct SystemStatus {
    offline_supported: bool,
    sqlite_ready: bool,
    app_version: String,
}

#[tauri::command]
fn get_system_status() -> SystemStatus {
    SystemStatus {
        offline_supported: true,
        sqlite_ready: true,
        app_version: "1.0.0".into(),
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![get_system_status])
        .run(tauri::generate_context!())
        .expect("error while running Manisha Fashion Tauri application");
}
