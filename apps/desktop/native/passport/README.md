[简体中文](README.zh_CN.md) · **English**

# Cindy Passport BLE

The matching ESP32-C3 firmware connects to Cindy on macOS. Enable it in Settings → Shortcuts → Accessories → Cindy Passport. Select a discovered device and enter its displayed pairing code if macOS asks. The menu-bar control remains available. Bluetooth access is required; the default is off. The owner-scoped `passport-settings.json` stores only explicit overrides. Reset removes the override; `CINDY_PASSPORT_BLE=1` sets the development default. Other platforms show an unsupported state.

Development uses the normal isolated wrapper:

```sh
pnpm restart:desktop:remote --region=global --isolated=@worktree
```

Development requires Xcode command-line tools; packaged builds include the Swift helper. Selected device IDs are scoped to the profile and data owner in UserDefaults. Disconnect clears automatic connection, not macOS/NimBLE bond keys. No Wi-Fi or HTTP substitution occurs.

The active local task catalog filters archived and worker sessions. Up to eight tasks are ranked waiting, error, running, completed. Observed completed/error states remain in memory after the activity overlay clears them, capped at 100; adapter stop clears history. Busy tasks may fill all eight slots. Remote mirrored tasks and sidebar ordering are not reproduced.

On the device, UP/DOWN selects, OK opens details, then OK starts recording. Another OK sends; holding OK cancels/exits. Audio uses 16 kHz mono, fixed 16 kbit/s Opus, 60 ms frames. The helper receives acknowledged BLE indications; main checks recording token, sequence, size, task, account and connection. Full audio is Ogg-wrapped in memory and passed to `transcribeVoiceInputAudioFile`, Cindy's existing batch ASR route. This may differ from the realtime microphone provider. Credentials remain in Cindy.

The original task opens after transcription. Only an empty composer draft is filled; an existing draft is preserved and the transcription waits. The user reviews and sends. No automatic agent message or approval is issued. The Accessories page reports recording/transcription failure. Device task details also show transcription progress. No raw audio or text is logged.

Service `C1DC0001-51C4-499D-A186-4621A4938301`: authenticated RX `8302`, authenticated read/notify TX `8303`, voice indicate `8304`. Task protocol remains v1: uint16LE length, version, count, then 40/80/16/192-byte NUL-padded UTF-8 fields. Voice v1: kind:u8, token:u32LE, sequence:u16LE; start=1 (40-byte ID), audio=2 (120 bytes), finish=3, cancel=4. Sequence begins at zero and increments for every audio frame; terminal packets carry the next sequence. Maximum 502 frames and 45 seconds elapsed, including the firmware's silent encoder flush. Firmware/client must both support voice; older firmware still supports task snapshots.

Host tests and builds do not prove physical recording quality, no-PSRAM memory headroom, permissions, reconnect or Chinese display quality. These require the updated board firmware and manual acceptance. No physical flashing is performed by the build.
