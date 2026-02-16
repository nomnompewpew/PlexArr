// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::process::Command;
use dirs;

#[derive(Debug, Serialize, Deserialize)]
struct SystemInfo {
    platform: String,
    arch: String,
    os_version: String,
    hostname: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct DiskSpace {
    available: u64,
    total: u64,
}

// Get system information
#[tauri::command]
fn get_system_info() -> Result<SystemInfo, String> {
    let platform = std::env::consts::OS.to_string();
    let arch = std::env::consts::ARCH.to_string();
    
    let os_version = {
        #[cfg(target_os = "windows")]
        {
            get_windows_version()
        }
        #[cfg(target_os = "macos")]
        {
            get_macos_version()
        }
        #[cfg(target_os = "linux")]
        {
            get_linux_version()
        }
    };
    
    let hostname = hostname::get()
        .map(|h| h.to_string_lossy().to_string())
        .unwrap_or_else(|_| "unknown".to_string());

    Ok(SystemInfo {
        platform,
        arch,
        os_version,
        hostname,
    })
}

// Check available disk space
#[tauri::command]
fn check_disk_space(path: String) -> Result<DiskSpace, String> {
    let check_path = if path.is_empty() {
        // Use home directory if no path provided
        dirs::home_dir()
            .ok_or("Unable to determine home directory")?
            .to_string_lossy()
            .to_string()
    } else {
        path
    };

    #[cfg(target_os = "windows")]
    {
        check_disk_space_windows(&check_path)
    }
    #[cfg(target_os = "macos")]
    {
        check_disk_space_unix(&check_path)
    }
    #[cfg(target_os = "linux")]
    {
        check_disk_space_unix(&check_path)
    }
}

// Execute a command and return output
#[tauri::command]
async fn execute_command(command: String, args: Vec<String>) -> Result<String, String> {
    let output = Command::new(command)
        .args(args)
        .output()
        .map_err(|e| format!("Failed to execute command: {}", e))?;

    if output.status.success() {
        String::from_utf8(output.stdout)
            .map_err(|e| format!("Invalid UTF-8 output: {}", e))
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

// Platform-specific helper functions
#[cfg(target_os = "windows")]
fn get_windows_version() -> String {
    // Use WMI or registry to get Windows version
    "Windows".to_string()
}

#[cfg(target_os = "macos")]
fn get_macos_version() -> String {
    let output = Command::new("sw_vers")
        .arg("-productVersion")
        .output();
    
    match output {
        Ok(out) => String::from_utf8_lossy(&out.stdout).trim().to_string(),
        Err(_) => "macOS".to_string(),
    }
}

#[cfg(target_os = "linux")]
fn get_linux_version() -> String {
    let output = Command::new("lsb_release")
        .args(["-d", "-s"])
        .output();
    
    match output {
        Ok(out) => String::from_utf8_lossy(&out.stdout).trim().to_string(),
        Err(_) => {
            // Fallback to reading /etc/os-release
            std::fs::read_to_string("/etc/os-release")
                .ok()
                .and_then(|content| {
                    content.lines()
                        .find(|line| line.starts_with("PRETTY_NAME="))
                        .map(|line| line.trim_start_matches("PRETTY_NAME=").trim_matches('"').to_string())
                })
                .unwrap_or_else(|| "Linux".to_string())
        }
    }
}

#[cfg(unix)]
fn check_disk_space_unix(path: &str) -> Result<DiskSpace, String> {
    use std::ffi::CString;
    use std::mem;
    
    let c_path = CString::new(path).map_err(|e| format!("Invalid path: {}", e))?;
    
    unsafe {
        let mut stat: libc::statvfs = mem::zeroed();
        if libc::statvfs(c_path.as_ptr(), &mut stat) == 0 {
            let available = stat.f_bavail * stat.f_frsize;
            let total = stat.f_blocks * stat.f_frsize;
            Ok(DiskSpace { available, total })
        } else {
            Err("Failed to get disk space".to_string())
        }
    }
}

#[cfg(target_os = "windows")]
fn check_disk_space_windows(path: &str) -> Result<DiskSpace, String> {
    use std::os::windows::ffi::OsStrExt;
    use std::ffi::OsStr;
    use std::mem;
    
    let wide_path: Vec<u16> = OsStr::new(path)
        .encode_wide()
        .chain(Some(0))
        .collect();
    
    unsafe {
        let mut free_bytes_available: u64 = 0;
        let mut total_bytes: u64 = 0;
        let mut total_free_bytes: u64 = 0;
        
        let result = GetDiskFreeSpaceExW(
            wide_path.as_ptr(),
            &mut free_bytes_available as *mut _ as *mut _,
            &mut total_bytes as *mut _ as *mut _,
            &mut total_free_bytes as *mut _ as *mut _,
        );
        
        if result != 0 {
            Ok(DiskSpace {
                available: free_bytes_available,
                total: total_bytes,
            })
        } else {
            Err("Failed to get disk space".to_string())
        }
    }
}

#[cfg(target_os = "windows")]
extern "system" {
    fn GetDiskFreeSpaceExW(
        lpDirectoryName: *const u16,
        lpFreeBytesAvailableToCaller: *mut i64,
        lpTotalNumberOfBytes: *mut i64,
        lpTotalNumberOfFreeBytes: *mut i64,
    ) -> i32;
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_system_info,
            check_disk_space,
            execute_command
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
