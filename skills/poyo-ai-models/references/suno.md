# Suno workflows

Read this reference together with `text2audio.md` or `audio2audio.md` for every Suno request. The Capability Catalog remains authoritative; call `poyo_describe_model` (or CLI `describe`) before submitting.

## Mashup and Sounds

- `generate-music` accepts `mv` values `V4`, `V4_5`, `V4_5ALL`, `V4_5PLUS`, `V5`, `V5_5`, `V6`, `V6_MINI`, and `V6_WILD`. In custom mode, `title` is required and at least one of `style`, `lyrics`, or `negative_tags` is required. `lyrics` takes priority over `prompt`. `variety` is an integer from 0 to 4 and is only applied in custom mode. Non-custom mode still accepts `prompt` alone, and can also use `style`, `lyrics`, `image_urls`, `video_urls`, or `audio_urls`. Reference files are rejected in custom mode.
- `duration` is 10-360 integer seconds. It requires custom mode and `mv` of `V5_5`, `V6`, `V6_MINI`, or `V6_WILD`.
- `persona_id` with `persona_model` requires custom mode and `mv` of `V5`, `V5_5`, `V6`, `V6_MINI`, or `V6_WILD`.
- `generate-mashup` requires exactly two values in `upload_url_list`, plus `style` and `title`. `mv` supports `V4` through `V6_WILD`.
- `generate-sounds` requires `prompt` and `mv` (`V5`, `V5_5`, `V6`, `V6_MINI`, or `V6_WILD`). `sound_tempo` is an integer from 1-300; `sound_key` is one of the major/minor keys declared by the model schema.
- `upload-and-cover-audio` accepts either `upload_url`, or `task_id` together with `audio_id`.
- `upload-and-extend-audio` is always custom mode. `default_param_flag: false` is rejected.
- `extend-music` requires `mv` even when `default_param_flag` is `false`.
- `add-vocals` and `add-instrumental` accept `mv` values `V4_5PLUS`, `V5`, `V5_5`, `V6`, `V6_MINI`, and `V6_WILD`. Default is `V4_5PLUS`.
- Submit either model with `poyo_submit_job`, then pass the returned PoYo task ID to `poyo_check_job` until the status is terminal.

## Suno Voice

1. Submit `suno-voice-validate` with a public `voice_url` and a clean `vocal_start_s`/`vocal_end_s` segment.
2. Poll the returned PoYo task ID. Read the verification phrase from `files[].validate_info`.
3. Record that phrase and submit `suno-voice-generate`, using the validation task ID as `task_id` and the recording URL as `verify_url`.
4. Poll the new PoYo task ID until `files[].voice_id` is present. Submit `suno-voice-check` with that generation task ID; Check returns another PoYo task ID whose result contains `files[].is_available`.
5. If the phrase expired, submit `suno-voice-regenerate` with the original validation task ID, poll the new task for updated `validate_info`, then use that new regeneration task ID with `suno-voice-generate`.

Use only task IDs returned by the public API. A generated voice can be used in custom parameter mode on supported V5, V5_5, V6, V6_MINI, and V6_WILD music models through `persona_id` plus `persona_model: "voice_persona"`.

## Retry safety

Do not automatically repeat paid submissions for `generate-mashup` or `generate-sounds`. After a timeout or transport error, first use the known PoYo task ID with `poyo_check_job` or inspect task history to determine whether submission succeeded.
