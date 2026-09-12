import {useSyncExternalStore} from 'react';
export function routeLocation(){return window.location.hash.startsWith('#/')?window.location.hash.slice(1):'/'}
function subscribe(callback:()=>void){window.addEventListener('hashchange',callback);return()=>window.removeEventListener('hashchange',callback)}
export function useLocation(){return useSyncExternalStore(subscribe,routeLocation,()=>'/')}
export function usePathname(){return useLocation().split('?')[0]}
export function useSearchParams(){const location=useLocation();return new URLSearchParams(location.includes('?')?location.slice(location.indexOf('?')+1):'')}
export function routeHref(path:string){return path.startsWith('/')?'/#'+path:path}
export function useRouter(){return {push:(path:string)=>{window.location.hash=path;window.scrollTo(0,0)},replace:(path:string)=>{history.replaceState(null,'',routeHref(path));window.dispatchEvent(new HashChangeEvent('hashchange'))},refresh:()=>window.dispatchEvent(new HashChangeEvent('hashchange'))}}
