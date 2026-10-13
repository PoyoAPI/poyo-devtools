# Meshy 7.1

Describe the selected model before submitting:

- `meshy-7.1-text-to-3d`: required `prompt` (1–600 characters), `mode="full"` by default; preview returns geometry without textures. Supports optional `seed` and `enable_prompt_expansion` (default false).
- `meshy-7.1-image-to-3d`: exactly one URL in `image_urls`.
- `meshy-7.1-multi-image-to-3d`: 1–4 URLs in `image_urls`, showing the same object from different angles.

Text and single-image models accept `model_type="standard"`, `lowpoly`, or `smart-topology`, and optional `geometry_resolution="standard"`, `2k`, or `4k`. Multi-image accepts only standard/2k geometry and has no `model_type`.

`target_polycount` accepts 100–300000 (default 30000). Smart Topology allows at most 15000 and defaults to 4000. `topology` is triangle (default) or quad. Lowpoly ignores remeshing controls. Retained controls include `should_remesh`, `symmetry_mode`, `pose_mode`, `enable_pbr`, `texture_prompt`, `texture_image_url`, and `enable_safety_checker`; inspect their current schema defaults. Image models use `should_texture` (default true). On multi-image generation, PBR and texture guidance require textures.

`enable_animation=true` requires `enable_rigging=true`. `rigging_height_meters` must be positive (default 1.7), and `animation_action_id` accepts 0–696 (default 92). Base generation, textures, rigging, and animation affect pricing; inspect the quote before submitting.

```json
{
  "image_urls": ["https://example.com/front.png", "https://example.com/back.png"],
  "geometry_resolution": "2k",
  "enable_rigging": true,
  "enable_animation": true
}
```

Use JSON or CLI `--input-file` for structured inputs: `poyo run meshy-7.1-multi-image-to-3d --input-file character.json --wait 0 --request-source skill`. For filtered MCP, call `poyo_meshy_7_1_multi_image_to_3d` with `_wait_seconds=0` and `_request_source="skill"`. Poll the task to completion; model/animation assets use `file_type="3d"`, and textures/thumbnails use `image`.
