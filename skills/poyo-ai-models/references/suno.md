# Suno workflows

Read this reference together with `text2audio.md` or `audio2audio.md` for every Suno request. The Capability Catalog remains authoritative; call `poyo_describe_model` (or CLI `describe`) before submitting.

## Mashup and Sounds

- `generate-mashup` requires exactly two values in `upload_url_list`. `mv` supports `V4`, `V4_5`, `V4_5ALL`, `V4_5PLUS`, `V5`, and `V5_5`. `duration` is 10-360 integer seconds and only works with `custom_mode: true` plus `mv: V5_5`.
- `generate-sounds` requires `prompt` and `mv` (`V5` or `V5_5`). `sound_tempo` is an integer from 1-300; `sound_key` is one of the major/minor keys declared by the model schema.
- Submit either model with `poyo_submit_job`, then pass the returned PoYo task ID to `poyo_check_job` until the status is terminal.

## Suno Voice

1. Submit `suno-voice-validate` with a public `voice_url` and a clean `vocal_start_s`/`vocal_end_s` segment.
2. Poll the returned PoYo task ID. Read the verification phrase from `files[].validate_info`.
3. Record that phrase and submit `suno-voice-generate`, using the validation task ID as `task_id` and the recording URL as `verify_url`.
4. Poll the new PoYo task ID until `files[].voice_id` is present. Submit `suno-voice-check` with that generation task ID; Check returns another PoYo task ID whose result contains `files[].is_available`.
5. If the phrase expired, submit `suno-voice-regenerate` with the original validation task ID, poll the new task for updated `validate_info`, then use that new regeneration task ID with `suno-voice-generate`.

Use only task IDs returned by the public API. A generated voice can be used in custom parameter mode on supported V5/V5_5 music models through `persona_id` plus `persona_model: "voice_persona"`.

## Retry safety

Do not automatically repeat paid submissions for `generate-mashup`, `generate-sounds`, or `stem-split-advanced`. After a timeout or transport error, first use the known PoYo task ID with `poyo_check_job` or inspect task history to determine whether submission succeeded.
