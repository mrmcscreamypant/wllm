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

wllm.prebuiltAppConfig.model_list.map(model => model.model_id).forEach(id => console.log(id));

document.getElementById("loading-progress")?.addEventListener("resize", () => fitAddon.fit());

const converter = new showdown.Converter({ ghCodeBlocks: true, omitExtraWLInCodeBlocks: true, smoothLivePreview: true, emoji: true });

async function runWorker() {
    const engine = await wllm.CreateWebWorkerMLCEngine(
        new Worker(new URL("./worker.ts", import.meta.url), { type: "module" }),
        "Llama-3.1-8B-Instruct-q4f16_1-MLC", { initProgressCallback: (progress: any) => { term.writeln(progress.text); document.getElementById("progress-bar").value = progress.progress; } }
    );

    const artyom = new Artyom();

    artyom.fatality();// use this to stop any of

    setTimeout(function () {// if you use artyom.fatality , wait 250 ms to initialize again.
        artyom.initialize({
            lang: "en-GB",// A lot of languages are supported. Read the docs !
            continuous: true,// recognize 1 command and stop listening !
            listen: true, // Start recognizing
            debug: false, // Show everything in the console
            speed: 1 // talk normally
        }).then(function () {
            console.log("Ready to work !");
        });
    }, 250);

    const messages: wllm.ChatCompletionMessageParam[] = [
        { role: "system", content: "You are an AI assistant. You search the web for information and report on it." },
        { role: "user", content: "Introduce yourself" },
    ]

    artyom.newDictation({
        continuous: true, // Enable continuous if HTTPS connection
        onResult: function (text: string) {
            messages.push({role: "assistant", content: text})
            respond(engine, messages, artyom);
        },
        onStart: function () {
            console.log("Dictation started by the user");
        },
        onEnd: function () {
            respond
        }
    });

    await respond(engine, messages, artyom);
}

async function respond(engine: wllm.WebWorkerMLCEngine, messages: wllm.ChatCompletionMessageParam[], artyom: Artyom) {
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
    }

    const fullReply = await engine.getMessage();
    messages.push({ role: "assistant", content: fullReply });
    console.log(fullReply);
    artyom.say(fullReply);
}

runWorker();