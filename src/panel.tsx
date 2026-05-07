import React from 'react';
import * as THREE from 'three';
import * as Fiber from '@react-three/fiber';
import * as DREI from '@react-three/drei';

export default function Panel({ children, className }: { className?: string } & React.PropsWithChildren): React.JSX.Element {
    return <DREI.Html occlude transform className={'panel ' + className} >
        {children}
    </DREI.Html>;
}