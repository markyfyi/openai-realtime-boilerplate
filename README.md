Realtime AI assistant minimal boilerplate

- Uses React, Vite and Tailwind.
- `src/main.tsx` shows how to spin up an audio assistant in ~100loc.
- I took OpenAI's [Realtime console](https://github.com/openai/openai-realtime-console) and whittled it down to the bare minimum. `relay-server` and `src/wav` are from the original repo.
- Demonstrates tool use in `src/main.tsx` (`get_current_date_and_time`). Sometimes the assistant doesn't recognize the tool, just ask it to try again.

To get started, run the following commands in your terminal:

```sh
pnpm i
cp .env.template .env
# add your openai api key to .env...
pnpm run dev
```

Then open `http://localhost:8080` in your browser and click anywhere to start talking to the assistant.
