import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import Landing from './components/landing';
import Auth from './components/auth';
import Shell from './components/shell';
import Router from './components/router';
import Admin from './components/admin';
import {useApp} from './components/provider';
import {Empty,Loading} from './components/ui';
import {useLocation} from './lib/navigation';
import {browserDb} from './lib/supabase';
import './styles.css';
class ErrorBoundary extends React.Component<{children:React.ReactNode},{error:boolean}>{state={error:false};static getDerivedStateFromError(){return {error:true}}render(){return this.state.error?<main className="empty"><h1>We hit an unexpected block.</h1><button className="button" onClick={()=>location.reload()}>Reload ConnectX</button></main>:this.props.children}}
function AdminGuard(){const {ready,user,role}=useApp();if(!ready)return <Loading/>;return user?.status==='active'&&['owner','admin'].includes(role)?<Admin/>:<Empty title="Staff access only">The database restricts administration to active staff accounts.</Empty>}
function App(){const location=useLocation();const [authReady,setAuthReady]=useState(false);useEffect(()=>{const db=browserDb();const {data:{subscription}}=db.auth.onAuthStateChange(event=>{if(event==='PASSWORD_RECOVERY')window.location.hash='/reset-password'});void db.auth.getSession().then(({error})=>{if(error){sessionStorage.setItem('cx-auth-error',error.message);window.location.hash='/login';}const flow=new URLSearchParams(window.location.search).get('flow');if(flow==='recovery'&&!error)window.location.hash='/reset-password';else if(flow==='confirmation'&&!error)window.location.hash='/home';if(window.location.search)history.replaceState(null,'',window.location.pathname+window.location.hash);setAuthReady(true)});return()=>subscription.unsubscribe()},[]);
 const path=location.split('?')[0];const route=path.split('/').filter(Boolean);
 useEffect(()=>{document.title=(route[0]?route[0][0].toUpperCase()+route[0].slice(1)+' · ':'')+'ConnectX';window.scrollTo(0,0)},[path]);
 if(!authReady)return <Loading/>;
 if(!route.length)return <Landing/>;
 if(['login','register','forgot-password','reset-password'].includes(route[0]))return <Auth key={route[0]} mode={route[0]}/>;
 return <Shell>{route[0]==='admin'?<AdminGuard/>:<Router key={path} route={route}/>}</Shell>;
}
createRoot(document.getElementById('root')!).render(<ErrorBoundary><App/></ErrorBoundary>);
