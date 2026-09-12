export function authDestination(search:string,hasSession:boolean,failed:boolean):string|null{
 const params=new URLSearchParams(search);
 if(failed||params.has('error')||params.has('error_code'))return '/login';
 const flow=params.get('flow');
 if(flow==='recovery')return hasSession?'/reset-password':'/login';
 if(['discord','apple','azure','google'].includes(flow||''))return hasSession?'/home':'/login';
 if(flow==='confirmation')return hasSession?'/home':'/login';
 return null;
}
