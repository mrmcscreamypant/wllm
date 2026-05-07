import * as wllm from "@mlc-ai/web-llm";
import showdown from 'showdown';
import * as xterm from '@xterm/xterm';
import Artyom from 'artyom.js';
//@ts-ignore
import "./index.css";
//@ts-ignore
import '@xterm/xterm/css/xterm.css';
import { FitAddon } from "@xterm/addon-fit";

const fitAddon = new FitAddon();
const term = new xterm.Terminal({ fontFamily: "'monospace'" });
term.loadAddon(fitAddon);
//@ts-ignore
term.open(document.getElementById("loading-progress"));
fitAddon.fit();

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register(
        new URL("sw.ts", import.meta.url),
        { type: "module" },
    );
}

wllm.prebuiltAppConfig.model_list.map(model => model.model_id).forEach(id => console.log(id));

document.getElementById("loading-progress")?.addEventListener("resize", () => fitAddon.fit());

const converter = new showdown.Converter({ ghCodeBlocks: true, omitExtraWLInCodeBlocks: true, smoothLivePreview: true, emoji: true });
converter.setFlavor("github");

async function runWorker() {
    const engine = await wllm.CreateWebWorkerMLCEngine(
        new Worker(new URL("./worker.ts", import.meta.url), { type: "module" }),
        "Qwen3-0.6B-q4f16_1-MLC",
        { initProgressCallback: (progress: any) => { term.clear(); term.writeln(progress.text); document.getElementById("progress-bar").value = progress.progress; } }
    );

    const artyom = new Artyom();

    artyom.fatality();

    setTimeout(function () {
        artyom.initialize({
            lang: "en-US",
            debug: false,
            speed: 1,
        }).then(function () {
            console.log("Ready to work !");
        });
    }, 250);

    const messages: wllm.ChatCompletionMessageParam[] = [
        { role: "system", content: "You are an AI assistant. Keep your answers to a sentance or two." },
        { role: "user", content: "Introduce yourself" },
    ];

    let query = "";

    const listen = () => artyom.newDictation({
        continuous: true,
        soundx: true,
        onResult: function (text: string) {
            if (text === "") {
                term.writeln(query);
                messages.push({ role: "user", content: query })
                respond(engine, messages, artyom);
            }
            query = text;
        },
    }).start();

    //listen();

    const input = document.getElementById("input");

    input?.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            messages.push({ role: "user", content: input.value });
            input.value = "";
            respond(engine, messages, artyom);
        }
    })

    //await respond(engine, messages, artyom);
}

async function respond(engine: wllm.WebWorkerMLCEngine, messages: wllm.ChatCompletionMessageParam[], artyom: Artyom) {
    const chunks = await engine.chat.completions.create({
        messages,
        temperature: 1,
        stream: true,
        stream_options: { include_usage: true },
        extra_body: {
            enable_thinking: true
        }
    });

    let result = "";
    for await (const chunk of chunks) {
        result += chunk.choices[0]?.delta.content || "";
        let thinking = result.includes("<think>") && !result.includes("</think>");
        if (thinking) {
            term.write(chunk.choices[0]?.delta.content || "");
        }
        //@ts-ignore
        document.getElementById("output").innerHTML = converter.makeHtml(result.replace(/<think>.*?((<\/think>)|$)/s, ""));
    }

    const fullReply = await engine.getMessage();
    messages.push({ role: "assistant", content: fullReply });
    console.log(fullReply);
    artyom.say(fullReply);
}

runWorker();