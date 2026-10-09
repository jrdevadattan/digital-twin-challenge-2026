# Final walkthrough: verification summary

The final walkthrough uses Kokoro-82M v1.0 with the stock Heart (`af_heart`) neural voice. The participant approved this stock voice on 9 October 2026. Narration is AI-generated and does not clone or impersonate the participant. See [voice and model credits](NEURAL-VOICE-CREDITS.txt).

## Verified export

- Duration: exactly 1,200 seconds (20:00), for both video and audio.
- Picture: 1920 × 1080, H.264, 15 frames per second, 18,000 frames.
- Sound: AAC, mono, 24 kHz.
- The full export passed a complete decode check. Sampled visual checks were performed; this is not a claim of a complete human listen-through or exhaustive audiovisual review.
- Selected benchmark-number pronunciation inputs were checked, including PR-AUC values, confidence-interval endpoints, threshold, precision, recall, episode counts and false-alert burden. This text/phoneme check is not independent verification of every spoken word.
- [Transcript](GlucoTwin-transcript.txt) and [SRT captions](GlucoTwin-captions.srt) accompany this export. Sentence timing comes from generated waveforms; caption-line boundaries within sentences are approximately allocated by text length.

## File identity

Primary export: `GlucoTwin-neural-voice-20min.mp4` (27,785,640 bytes).
SHA-256: `5357dc2f695ee8b6205d61f549ca92bfab547ed11c025253b23d50d108696f78`.

Smaller download export: `GlucoTwin-neural-voice-download.mp4` (19,403,027 bytes).
SHA-256: `b168911a1d39b4ddde6dfca7e99e9e40e7b366c4850158ac1208258b58b2e7a7`.
Both exports passed full decode and have the same duration, resolution and frame count. MP4 files are distributed separately and are not committed to this repository.

## Submission status

The final video has been generated. The participant supplied [the YouTube watch URL](https://youtu.be/Uz4Lio8GJTE). A logged-out check on 9 October 2026 displayed the title GlucoTwin, duration 20:00, visibility Unlisted and channel D (`@user-qd6fc6pi5h`). This verifies the displayed watch-page metadata, not a complete remote playback check or an independent audio-version comparison. The repository was made public and the Unstop entry was submitted on 9 October 2026 (approximately 19:41 IST). The saved submission was reopened and verified at 14:12 UTC (19:42 IST), including the public repository URL and all 12 saved checklist items. This confirms submission, not selection or acceptance. No clinical validation or clinical deployment is claimed.
