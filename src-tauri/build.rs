use std::process::Command;

fn main() {
    tauri_build::build();

    // Embed RPATH so the binary finds libpython3.13.so at runtime
    // without needing LD_LIBRARY_PATH (which poisons system libs).
    if let Ok(out) = Command::new("python3")
        .args(["-c", "import sysconfig; print(sysconfig.get_config_var('LIBDIR'))"])
        .output()
    {
        let libdir = String::from_utf8_lossy(&out.stdout).trim().to_string();
        if !libdir.is_empty() {
            println!("cargo:rustc-link-arg=-Wl,-rpath,{libdir}");
        }
    }
}
