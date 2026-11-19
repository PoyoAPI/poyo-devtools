# HeyGen Avatar 6 and HeyGen Avatar 6 Turbo

Public models: `heygen-avatar-6` and the lower-cost `heygen-avatar-6-turbo`. Filtered MCP tools: `poyo_heygen_avatar_6` and `poyo_heygen_avatar_6_turbo`.

Describe the selected model before execution. Both models create one lip-synced talking MP4 video with the same inputs and modes. The supplied inputs select the mode:

| Mode | Selected when | Inputs |
| --- | --- | --- |
| Public avatar | `avatar` is provided | `avatar`, plus `audio_url` or `text` |
| Reference video | `video_url` is provided | `video_url` and `audio_url`, plus an optional reference photo in `image_urls` |
| Photo | By default | `image_urls` and `audio_url` |

Every mode also accepts `prompt` and `resolution`. Use the inputs of one mode in each request.

| Field | Contract |
| --- | --- |
| `image_urls` | Exactly one public HTTP(S) image: the person to animate in photo mode, or a reference photo of the character in reference video mode |
| `video_url` | A video of an animated or illustrated character, at least 2 seconds and up to 50 MB |
| `avatar` | One of the 1,248 public avatar names listed in the docs page Avatars and Voices, such as `Abigail Sofa Front`; matching ignores letter case and extra spaces |
| `audio_url` | Speech audio, 2–60 seconds and up to 15 MB; the video runs the length of the audio |
| `text` | Public avatar mode, in place of `audio_url`: up to 1,000 characters for the avatar to read |
| `voice` | Public avatar mode with `text`: one of the 102 listed voices; default `Warm Pro Narrator` |
| `prompt` | Optional direction for gestures, expression, and posture, up to 1,200 characters |
| `aspect_ratio` | Public avatar mode: `16:9` (default), `9:16`, `1:1`, `4:5`, or `5:4`; photo and reference video modes keep the input's aspect ratio |
| `resolution` | `1080p` (default) or `2K` |

- Avatar and voice lists: https://docs.poyo.ai/api-manual/video-series/heygen-avatar-6-avatars and the downloadable `heygen-avatar-6-catalog.json` on that page.
- Billing is per second of output. `heygen-avatar-6` charges 20 credits per second at `1080p` and 29 at `2K`; `heygen-avatar-6-turbo` charges 10 and 18.
- With `audio_url`, submission charges the audio length rounded up to whole seconds. With `text`, submission needs credits for 1.5 times the estimated reading time, and the final charge follows the actual video length.
- A short video usually finishes in about 2–3 minutes. Use `_wait_seconds: 0` or `poyo submit` and poll the task.

```bash
poyo describe heygen-avatar-6
poyo submit heygen-avatar-6 --image-urls https://example.com/presenter.png --audio-url https://example.com/speech.mp3 --prompt "Face the camera with a warm smile" --request-source skill
poyo submit heygen-avatar-6-turbo --video-url https://example.com/cartoon-character.mp4 --audio-url https://example.com/speech.mp3 --resolution 2K --request-source skill
poyo submit heygen-avatar-6-turbo --avatar "Abigail Office Front" --text "Hello and welcome to this demonstration." --voice "Warm Pro Narrator" --aspect-ratio 16:9 --request-source skill
```

Submit only user-selected fields. For filtered MCP, call the model-specific tool with `_wait_seconds: 0` and `_request_source: "skill"`. On unfiltered MCP, call `poyo_submit_job` with the model ID and the public fields under `input`; optional `callback_url` stays outside `input`. Poll `poyo_check_job` or `poyo task wait TASK_ID`, preserve the task ID, and report the final status, credits, and output URLs.
