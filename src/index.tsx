import './index.css';
import * as THREE from 'three/webgpu';
import * as React from 'react';
import * as Fiber from '@react-three/fiber';
import { createRoot } from 'react-dom/client';
import { WebGPURendererParameters } from 'three/src/renderers/webgpu/WebGPURenderer.js';
import { CSS3DRenderer } from 'three/addons/renderers/CSS3DRenderer.js';

function CSSRendererComponent({ displayRef }: { displayRef: React.RefObject<HTMLCanvasElement> }): null {
    let CSSRenderer: CSS3DRenderer;
    React.useEffect(() => { CSSRenderer = new CSS3DRenderer({ element: displayRef.current }); }, []);
    Fiber.useFrame(({ gl, scene, camera }) => {
        gl.render(scene, camera);
        CSSRenderer?.render(scene, camera);
    }, 1);
    return null;
}

function App(): React.JSX.Element {
    const displayRef = React.useRef(null);
    React.useEffect(() => {
        window.addEventListener('resize', () => {
            displayRef.current.style.width = `${window.innerWidth}px`;
            displayRef.current.style.height = `${window.innerHeight}px`;
        });
        window.dispatchEvent(new Event("resize"));
    }, []);
    return <Fiber.Canvas
        id="display"
        ref={displayRef}
        gl={async (props) => {
            const renderer = new THREE.WebGPURenderer(props as WebGPURendererParameters);
            await renderer.init();
            return renderer;
        }}>
        <pointLight position={[2, 2, 2]} />
        <mesh>
            <CSSRendererComponent displayRef={displayRef} />
            <sphereGeometry />
            <meshStandardMaterial color="hotpink" />
        </mesh>
    </Fiber.Canvas>;
}

createRoot(document.getElementById("root")).render(<App />);