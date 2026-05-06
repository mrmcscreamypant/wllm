import './index.css';
import * as React from 'react';
import { createRoot } from 'react-dom/client';
function App(): React.JSX.Element {
    return <>Hello, World!</>;
}
createRoot(document.getElementById("root")).render(<App />);