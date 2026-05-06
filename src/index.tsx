import './index.css';
import * as THREE from 'three/webgpu';
import * as React from 'react';
import * as Fiber from '@react-three/fiber';
import { createRoot } from 'react-dom/client';
import { WebGPURendererParameters } from 'three/src/renderers/webgpu/WebGPURenderer.js';
function App(): React.JSX.Element {
    React.useEffect(() => {
        const display = document.getElementById("display");
        window.addEventListener('resize', () => {
            display.style.width = `${window.innerWidth}px`;
            display.style.height = `${window.innerHeight}px`;
        });
        window.dispatchEvent(new Event("resize"));
    }, []);
    return <Fiber.Canvas
        id="display"
        gl={async (props) => {
            const renderer = new THREE.WebGPURenderer(props as WebGPURendererParameters);
            await renderer.init();
            return renderer;
        }}>
        <pointLight position={[10, 10, 10]} />
        <mesh>
            <sphereGeometry />
            <meshStandardMaterial color="hotpink" />
        </mesh>
    </Fiber.Canvas>;
}
createRoot(document.getElementById("root")).render(<App />);