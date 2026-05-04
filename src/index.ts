import { CreateWebWorkerMLCEngine } from "@mlc-ai/web-llm";
import * as xterm from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';

const term = new xterm.Terminal({fontFamily: "'monospace'"});
term.open(document.getElementById("output"));

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register(
        new URL("sw.ts", import.meta.url),  // worker script
        { type: "module" },
    );
}


async function runWorker() {
    const engine = await CreateWebWorkerMLCEngine(
        new Worker(new URL("./worker.ts", import.meta.url), { type: "module" }),
        "Llama-3.2-1B-Instruct-q4f32_1-MLC", { initProgressCallback: (progress: any) => { term.writeln(progress.text) } }
    );

    const messages = [
        { role: "system", content: "You are currently running in WASM on a school chromebook." },
        { role: "user", content: "Hello!" },
    ]

    // chunks is an AsyncGenerator object
    const chunks = await engine.chat.completions.create({
        messages,
        temperature: 1,
        stream: true, // <-- Enable streaming
        stream_options: { include_usage: true},
    });

    for await (const chunk of chunks) {
        term.write(chunk.choices[0]?.delta.content || "ERR");
        if (chunk.usage) {
            console.log(chunk.usage); // only last chunk has usage
        }
    }

    const fullReply = await engine.getMessage();
    console.log(fullReply);
}

runWorker();