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

for (const model of WLLM.prebuiltAppConfig.model_list) {
    console.log(model.model_id);
}

export default function Bot({ onOutputChange }: { onOutputChange: (value: string) => void }): React.JSX.Element {
    const [output, setOutput] = React.useState("");
    React.useEffect(() => onOutputChange(output), [output]);

    const [progress, setProgress] = React.useState<WLLM.InitProgressReport>(null);

    const backend = React.useRef(null);

    React.useEffect(() => {
        WLLM.CreateWebWorkerMLCEngine(
            new Worker(new URL("./worker.ts", import.meta.url), { type: "module" }),
            "SmolLM2-135M-Instruct-q0f16-MLC",
            { initProgressCallback: setProgress }
        ).then(async (value) => {
            backend.current = value;

            const messages: WLLM.ChatCompletionMessageParam[] = [
                { role: "system", content: "You are an AI assistant." },
                { role: "user", content: "What is the meaning of life? Give a long and thought out answer." },
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

    return <group position={[8.01, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <Panel className="progress-panel">
            <progress value={progress?.progress} />
            <div>{progress?.text}</div>
        </Panel>
    </group>;
}