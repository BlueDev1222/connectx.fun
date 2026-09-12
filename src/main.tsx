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
import {authDestination} from './lib/auth-redirect';
class ErrorBoundary extends React.Component<{children:React.ReactNode},{error:boolean}>{state={error:false};static getDerivedStateFromError(){return {error:true}}render(){return this.state.error?<main className="empty"><h1>We hit an unexpected block.</h1><button className="button" onClick={()=>location.reload()}>Reload ConnectX</button></main>:this.props.children}}
function AdminGuard(){const {ready,user,role}=useApp();if(!ready)return <Loading/>;return user?.status==='active'&&['owner','admin'].includes(role)?<Admin/>:<Empty title="Staff access only">The database restricts administration to active staff accounts.</Empty>}
function App(){const location=useLocation();const [authReady,setAuthReady]=useState(false);
useEffect(()=>{
 const callbackSearch=window.location.search || (window.location.hash.startsWith('#error')?'?'+window.location.hash.slice(1):'');
 const db=browserDb();
 const {data:{subscription}}=db.auth.onAuthStateChange(event=>{if(event==='PASSWORD_RECOVERY')window.location.hash='/reset-password'});
 void (async()=>{
  try{
   const {data:{session},error}=await db.auth.getSession();
   const destination=authDestination(callbackSearch,Boolean(session),Boolean(error));
   if(destination==='/login'&&(error||new URLSearchParams(callbackSearch).has('flow')||new URLSearchParams(callbackSearch).has('error'))){sessionStorage.setItem('cx-auth-error','Sign-in was cancelled or could not be completed. Please try again or use email.');}
   if(destination)window.location.hash=destination;
  }catch{sessionStorage.setItem('cx-auth-error','Unable to complete sign-in. Please try again.');window.location.hash='/login';}
  finally{if(window.location.search)history.replaceState(null,'',window.location.pathname+window.location.hash);setAuthReady(true)}
 })();
 return()=>subscription.unsubscribe();
},[]);
 const path=location.split('?')[0];const route=path.split('/').filter(Boolean);
 useEffect(()=>{document.title=(route[0]?route[0][0].toUpperCase()+route[0].slice(1)+' · ':'')+'ConnectX';window.scrollTo(0,0)},[path]);
 if(!authReady)return <Loading/>;
 if(!route.length)return <Landing/>;
 if(['login','register','forgot-password','reset-password'].includes(route[0]))return <Auth key={route[0]} mode={route[0]}/>;
 return <Shell>{route[0]==='admin'?<AdminGuard/>:<Router key={path} route={route}/>}</Shell>;
}
createRoot(document.getElementById('root')!).render(<ErrorBoundary><App/></ErrorBoundary>);
