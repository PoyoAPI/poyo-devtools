# @poyo/cli

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
