import type {AnchorHTMLAttributes} from 'react';
import {routeHref} from './navigation';
export default function Link({href,...props}:AnchorHTMLAttributes<HTMLAnchorElement>&{href:string}){return <a {...props} href={routeHref(href)}/>}
