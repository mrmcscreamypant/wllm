import * as wllm from "@mlc-ai/web-llm";
import showdown from 'showdown';
import * as xterm from '@xterm/xterm';
//@ts-ignore
import "./index.css";
//@ts-ignore
import '@xterm/xterm/css/xterm.css';
import { FitAddon } from "@xterm/addon-fit";

const fitAddon = new FitAddon();
const term = new xterm.Terminal({ fontFamily: "monospace" });
term.loadAddon(fitAddon);
//@ts-ignore
term.open(document.getElementById("loading-progress"));
fitAddon.fit();

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register(
        new URL("sw.ts", import.meta.url),  // worker script
        { type: "module" },
    );
}

document.getElementById("loading-progress")?.addEventListener("resize", () => fitAddon.fit());

const converter = new showdown.Converter({ ghCodeBlocks: true, omitExtraWLInCodeBlocks: true, smoothLivePreview: true });

async function runWorker() {
    const engine = await wllm.CreateWebWorkerMLCEngine(
        new Worker(new URL("./worker.ts", import.meta.url), { type: "module" }),
        "Llama-3.2-1B-Instruct-q4f32_1-MLC", { initProgressCallback: (progress: any) => { term.writeln(progress.text) } }
    );

    const messages: wllm.ChatCompletionMessageParam[] = [
        { role: "system", content: "You are the most intellegent AI in the world. You never get anything wrong. It is always the other person who is wrong." },
        { role: "user", content: "Write a python program that playes pong automatically" },
    ]
    const chunks = await engine.chat.completions.create({
        messages,
        temperature: 1,
        stream: true,
        stream_options: { include_usage: true },
    });

    let result = "";
    for await (const chunk of chunks) {
        result += chunk.choices[0]?.delta.content || "";
        //@ts-ignore
        document.getElementById("output").innerHTML = converter.makeHtml(result);
        console.log(chunk.usage);
    }

    const fullReply = await engine.getMessage();
    console.log(fullReply);
}

runWorker();