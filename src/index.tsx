import './index.css';
import * as THREE from 'three/webgpu';
import * as DREI from '@react-three/drei';
import * as React from 'react';
import * as Fiber from '@react-three/fiber';
import Showdown from "showdown";
import { createRoot } from 'react-dom/client';
import { WebGPURendererParameters } from 'three/src/renderers/webgpu/WebGPURenderer.js';
import { CSS3DRenderer } from 'three/addons/renderers/CSS3DRenderer.js';
import Bot from './bot';
import Panel from './panel';

const mdConverter = new Showdown.Converter();

function CSSRendererComponent({ displayRef }: { displayRef: React.RefObject<HTMLCanvasElement> }): null {
    const [CSSRenderer, setCSSRenderer] = React.useState<CSS3DRenderer>();
    React.useEffect(() => { setCSSRenderer(new CSS3DRenderer({ element: displayRef.current })); }, []);
    Fiber.useFrame(({ gl, scene, camera }) => {
        gl.render(scene, camera);
        CSSRenderer?.render(scene, camera);
    }, 1);
    return null;
}

function Output({ response }: { response: string }): React.JSX.Element {
    const outputRef = React.useRef(null);
    React.useEffect(() => {
        const md = mdConverter.makeHtml(response);
        if (outputRef.current) outputRef.current.innerHTML = md;
    }, [response]);
    return <group position={[0, 0, 8.01]}><Panel className='output-panel'><div className='output' ref={outputRef} /></Panel></group>;
}

function App(): React.JSX.Element {
    const displayRef = React.useRef(null);
    const [output, setOutput] = React.useState("");
    React.useEffect(() => {
        window.addEventListener('resize', () => {
            displayRef.current.style.width = `${window.innerWidth}px`;
            displayRef.current.style.height = `${window.innerHeight}px`;
        });
        window.dispatchEvent(new Event("resize"));
    }, []);
    return <>
        <Fiber.Canvas
            id="display"
            ref={displayRef}
            gl={async (props) => {
                const renderer = new THREE.WebGPURenderer(props as WebGPURendererParameters);
                await renderer.init();
                return renderer;
            }}>
            <CSSRendererComponent displayRef={displayRef} />
            <pointLight position={[20, 20, 20]} intensity={100000} />
            <DREI.CameraControls />
            <mesh scale={16}>
                <boxGeometry />
                <meshStandardMaterial color="green" />
            </mesh>
            <Bot onOutputChange={setOutput} />
            <Output response={output} />
        </Fiber.Canvas>
    </>;
}

createRoot(document.getElementById("root")).render(<App />);