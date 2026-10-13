# ElevenLabs V4 and Gemini 3.8 speech

Describe the selected model before execution. The four model IDs are `elevenlabs-v4-tts`, `elevenlabs-v4-turbo-tts`, `gemini-3.8-flash-lite-tts`, and `gemini-3.8-flash-tts`.

ElevenLabs requires `text` with 1–5,000 characters. It accepts `voice` (default Rachel), `stability` (0–1, default 0.5), `similarity_boost` (0–1, default 0.75), `timestamps` (default false), `language_code`, `apply_text_normalization` (auto/on/off), and `output_format`. Do not send `seed`. The live schema lists all 19 MP3, PCM, µ-law, A-law, and Opus formats; the default is `mp3_44100_128`. PCM has no WAV header. Preserve the returned bytes and decode raw formats with the selected sample rate. Timing data appears as a separate JSON result when available.

Gemini returns native WAV. Single-speaker requests use non-empty `text`, optional `voice` (default Kore), and optional `style_instructions`. Dialogue requires exactly two `speakers`, distinct non-empty `speaker_id` values, and non-empty `turns` referring to those IDs. Omit top-level `text` and `voice` for dialogue. Each turn supports optional `style_instructions`; global style instructions also work in dialogue. Complete input is limited to 8192 tokens. Gemini accepts `enable_safety_checker` (default true) and has no `output_format`, `temperature`, `language_code`, or `seed` controls.

```json
{
  "speakers": [
    {"speaker_id": "host", "voice": "Kore"},
    {"speaker_id": "guest", "voice": "Puck"}
  ],
  "style_instructions": "A relaxed podcast conversation",
  "turns": [
    {"speaker_id": "host", "text": "Welcome!"},
    {"speaker_id": "guest", "text": "Thank you.", "style_instructions": "Warm and friendly"}
  ]
}
```

Save the public input object above as `dialogue.json`, then use `poyo run gemini-3.8-flash-tts --input-file dialogue.json --request-source skill`. For filtered MCP, call `poyo_gemini_3_8_flash_tts` with the same arrays and `_request_source="skill"`. Never flatten speaker or turn objects into string lists. Billable character counts include transcript text and global/per-turn style instructions, excluding speaker IDs; inspect the live quote.
