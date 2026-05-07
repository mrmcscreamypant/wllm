import React from 'react';
import * as WLLM from '@mlc-ai/web-llm';
import * as THREE from 'three';
import Panel from './panel';
import Showdown from "showdown";

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register(
        new URL("sw.ts", import.meta.url),
        { type: "module" },
    ).catch(e => { throw e; });
}

for (const model of WLLM.prebuiltAppConfig.model_list) {
    console.log(model.model_id);
}

const mdConverter = new Showdown.Converter();

function Output({ response }: { response: string }): React.JSX.Element {
    const outputRef = React.useRef(null);
    React.useEffect(() => {
        const md = mdConverter.makeHtml(response);
        if (outputRef.current) outputRef.current.innerHTML = md;
    }, [response]);
    return <group position={[0, 0, 0.501]}><Panel className='output-panel'><div className='output' ref={outputRef} /></Panel></group>;
}


export default function Bot(): React.JSX.Element {
    const [output, setOutput] = React.useState("");
    const [progress, setProgress] = React.useState<WLLM.InitProgressReport>(null);
    const [backend, setBackend] = React.useState<WLLM.WebWorkerMLCEngine>(null);

    React.useEffect(() => {
        WLLM.CreateWebWorkerMLCEngine(
            new Worker(new URL("./worker.ts", import.meta.url), { type: "module" }),
            "SmolLM2-135M-Instruct-q0f16-MLC",
            { initProgressCallback: setProgress }
        ).then((value) => {
            setBackend(value);
        }).catch(e => { throw e; });
    }, []);

    React.useEffect(() => {
        if (!backend) return;

        const messages: WLLM.ChatCompletionMessageParam[] = [
            { role: "system", content: "You are an AI assistant." },
            { role: "user", content: "Who are you?" },
        ];

        backend.chat.completions.create({
            messages,
            temperature: 0.35,
            stream: true,
            stream_options: { include_usage: true },
            extra_body: {
                enable_thinking: false
            }
        }).then(async (chunks): Promise<void> => {
            let result = "";
            for await (const chunk of chunks) {
                result += chunk.choices[0]?.delta.content || "";
                setOutput(result);
                if (chunk.usage?.total_tokens) {
                    console.log(chunk.usage?.total_tokens);
                }
            }
        }).catch(e => { throw e; });
    }, [backend]);

    return <mesh>
        <boxGeometry />
        <meshStandardMaterial color="green" />
        <group position={[0.501, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <Panel className="progress-panel">
                <progress value={progress?.progress} />
                <div>{progress?.text}</div>
            </Panel>
        </group>
        <Output response={output} />
    </mesh>;
}