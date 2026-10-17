# OmniHuman 2.0

Public model: `omnihuman-2.0`. Filtered MCP tool: `poyo_omnihuman_2_0`.

Describe the live model before execution. Supply exactly one character image in `image_urls` and one publicly accessible HTTP or HTTPS driving-audio URL in `audio_url`. The image must also use a publicly accessible HTTP or HTTPS URL. Audio must last 4–300 seconds and be no larger than 15 MB. `prompt` is optional and controls the character's motion and performance.

Keep the image in the array. Submit only user-selected fields. This model does not accept requested `duration`, `resolution`, `aspect_ratio`, `seed`, or internal media/billing fields.

Audio duration provides a submission estimate. The final charge uses the generated video's returned duration, including fractional seconds without rounding up. Check live pricing before execution and report final credits from the completed task.

```sh
poyo describe omnihuman-2.0
poyo submit omnihuman-2.0 --image-urls https://example.com/character.png --audio-url https://example.com/voice.mp3 --request-source skill
```

For filtered MCP, call `poyo_omnihuman_2_0` with the public fields, `_wait_seconds: 0`, and `_request_source: "skill"`. On unfiltered MCP, use `poyo_submit_job` with `model: "omnihuman-2.0"` and put the image/audio fields under `input`. Poll `poyo_check_job` or `poyo task wait TASK_ID`. Preserve the task ID and do not resubmit automatically after a transport timeout.
