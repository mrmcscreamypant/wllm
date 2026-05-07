import './index.css';
import * as THREE from 'three/webgpu';
import * as DREI from '@react-three/drei';
import * as React from 'react';
import * as Fiber from '@react-three/fiber';
import { createRoot } from 'react-dom/client';
import { WebGPURendererParameters } from 'three/src/renderers/webgpu/WebGPURenderer.js';
import Bot from './bot';

function App(): React.JSX.Element {
    const displayRef = React.useRef(null);
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
            <DREI.AdaptiveDpr pixelated />
            <pointLight position={[4, 4, 4]} intensity={300} />
            <DREI.CameraControls />
            <Bot />
        </Fiber.Canvas>
    </>;
}

createRoot(document.getElementById("root")).render(<App />);