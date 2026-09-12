import {browserDb} from './supabase';
import {supabaseKey,supabaseUrl} from './public-config';
export async function edgeRequest(path:string,options:RequestInit={}){
 const {data:{session}}=await browserDb().auth.getSession();
 const headers=new Headers(options.headers);headers.set('apikey',supabaseKey);
 if(session)headers.set('Authorization','Bearer '+session.access_token);
 const response=await fetch(supabaseUrl+'/functions/v1/connectx-api/'+path,{...options,headers});
 return response;
}
export async function edgeJson(path:string,options:RequestInit={}){const response=await edgeRequest(path,options);const data=await response.json();if(!response.ok)throw Error(data.error||'Request failed.');return data;}
export async function downloadExport(){const response=await edgeRequest('export');if(!response.ok){const data=await response.json();throw Error(data.error||'Export failed.')}const url=URL.createObjectURL(await response.blob());const a=document.createElement('a');a.href=url;a.download='connectx-account.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
