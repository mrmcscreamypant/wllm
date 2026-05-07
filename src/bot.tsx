import React from 'react';
import * as WLLM from '@mlc-ai/web-llm';
import * as THREE from 'three';
import Panel from './panel';

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register(
        new URL("sw.ts", import.meta.url),
        { type: "module" },
    ).catch(e => { throw e; });
}

export default function Bot({ onOutputChange }: { onOutputChange: (value: string) => void }): React.JSX.Element {
    const [output, setOutput] = React.useState("");
    React.useEffect(() => onOutputChange(output), [output]);

    const [progress, setProgress] = React.useState<WLLM.InitProgressReport>(null);

    const backend = React.useRef(null);

    React.useEffect(() => {
        WLLM.CreateWebWorkerMLCEngine(
            new Worker(new URL("./worker.ts", import.meta.url), { type: "module" }),
            "Qwen3-0.6B-q4f16_1-MLC",
            { initProgressCallback: setProgress }
        ).then(async (value) => {
            backend.current = value;
            const messages: WLLM.ChatCompletionMessageParam[] = [
                { role: "system", content: "You are an AI assistant. Keep your answers to a sentance or two." },
                { role: "user", content: "Write a python hello world program. Explain what it does." },
            ];
            const chunks = await backend.current.chat.completions.create({
                messages,
                temperature: 1,
                stream: true,
                stream_options: { include_usage: true },
                extra_body: {
                    enable_thinking: false
                }
            });

            let result = "";
            for await (const chunk of chunks) {
                result += chunk.choices[0]?.delta.content || "";
                setOutput(result);
            }
        }).catch(e => { throw e; });
    }, []);

    return <group position={[5, 0, 2]}>
        <Panel className="progress-panel">
            <progress value={progress?.progress} />
            <div>{progress?.text}</div>
        </Panel>
    </group>;
}