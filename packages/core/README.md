# @poyo/core

Catalog-driven JavaScript client for the PoYo Agent API. Endpoint schemas are loaded from the hosted Capability Registry instead of being duplicated in this package.

## Install

```bash
npm install @poyo/core
```

Node.js 20 or newer is required.

## Usage

```ts
import {PoyoClient} from "@poyo/core";

const client = new PoyoClient({apiKey: process.env.POYO_API_KEY});
const capability = await client.capability("youtube/videos");
const task = await client.submit("youtube", "videos", {
  urls: ["https://www.youtube.com/watch?v=VIDEO_ID"],
});
const completed = await client.waitTask(task.task_id);
const downloaded = await client.downloadFiles(task.task_id, "./poyo-results");
```

Set `POYO_BASE_URL` or pass `baseUrl` to target another PoYo environment. The default is `https://api.poyo.ai`.

See the [PoYo website](https://poyo.ai/).

## License

MIT
