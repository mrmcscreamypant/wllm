import React from 'react';
import * as DREI from '@react-three/drei';

export default function Panel({ children, className }: { className?: string } & React.PropsWithChildren): React.JSX.Element {
    return <DREI.Html occlude transform className={'panel ' + className} scale={1 / 16}>
        {children}
    </DREI.Html>;
}