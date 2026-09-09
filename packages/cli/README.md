# @poyoapi/cli

Catalog-driven PoYo command line client.

```bash
poyo auth login
poyo models image
poyo describe fal/flux-dev
poyo chat openai/gpt-5 --stream --input '{"messages":[{"role":"user","content":"Hello"}]}'
poyo run fal/flux-dev --input '{"prompt":"A mountain lake"}'
poyo submit kie/kling-video --input-file request.json
poyo task wait TASK_ID
poyo mcp --categories image,video
```

Authentication priority is `--api-key`, `POYO_API_KEY`, system keyring, then the local config fallback.

Generate or edit one image with GPT Image 2.5:

```bash
poyo describe gpt-image-2.5-flare
poyo run gpt-image-2.5-flare --prompt "A small silver robot" --background transparent --output-format png --resolution 2K
poyo run gpt-image-2.5-sunburst --prompt "Replace the masked area with flowers" --image-urls https://example.com/room.png --mask-url https://example.com/mask.png --size auto
```

The model schema is discovered from the catalog. `--output-format` sets the image format; `--format` sets terminal output formatting. Each request returns one image.
