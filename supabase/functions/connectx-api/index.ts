import {createClient} from 'npm:@supabase/supabase-js@2.116.0';
import {validateMedia,MAX_MEDIA_BYTES} from './media-validation.ts';

const origins=new Set(['https://connectx.fun','https://www.connectx.fun','http://localhost:3000','http://localhost:4173']);
const url=Deno.env.get('SUPABASE_URL')!;
const anon=Deno.env.get('SUPABASE_ANON_KEY')!;
const service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const options={auth:{persistSession:false,autoRefreshToken:false}};

// Gateway JWT checking is disabled ONLY because every protected route below
// authenticates the bearer token using Auth getUser, including modern JWTs.
Deno.serve(async(request:Request)=>{
 const origin=request.headers.get('origin');
 const headers:Record<string,string>={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin'};
 if(origin&&origins.has(origin)){headers['Access-Control-Allow-Origin']=origin;headers['Access-Control-Allow-Headers']='authorization, apikey, content-type, x-client-info';headers['Access-Control-Allow-Methods']='GET, POST, OPTIONS';}
 const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers});
 if(origin&&!origins.has(origin))return json({error:'Origin not allowed.'},403);
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
 const path=new URL(request.url).pathname.split('/').filter(Boolean).at(-1);
 try{
  if(path==='status'&&request.method==='GET'){
   const db=createClient(url,anon,options);const result=await db.from('cx_config').select('key').eq('key','post_limit');
   return json({website:'GitHub Pages',database:result.error?'Unavailable':'Reachable',authentication:'Supabase Auth',media:'Supabase Storage · not monitored',messaging:'Supabase Realtime · not monitored',checked_at:new Date().toISOString()});
  }
  if(!['media','export','delete','minecraft'].includes(path||''))return json({error:'Endpoint not found.'},404);
  if(request.method!==(path==='export'?'GET':'POST'))return json({error:'Method not allowed.'},405);
  const authorization=request.headers.get('Authorization')||'';
  if(!authorization.startsWith('Bearer '))return json({error:'Sign in to continue.'},401);
  const token=authorization.slice(7);
  const db=createClient(url,anon,{...options,global:{headers:{Authorization:authorization}}});
  const {data:{user},error:authError}=await db.auth.getUser(token);
  if(authError||!user)return json({error:'Invalid or expired sign-in. Please sign in again.'},401);
  const {data:profile,error:profileError}=await db.from('cx_profiles').select('*').eq('id',user.id).single();
  if(profileError||profile?.status!=='active')return json({error:'An active account is required.'},403);
  // Privileged client is created only after identity and account status checks.
  const admin=createClient(url,service,options);
  if(path==='media'){
   const {error}=await db.rpc('cx_upload_check');if(error)throw error;
   const bytes=await boundedBody(request,MAX_MEDIA_BYTES+65536);
   const form=await new Request(request.url,{method:'POST',headers:{'Content-Type':request.headers.get('Content-Type')||''},body:bytes}).formData();
   const file=form.get('file');if(!(file instanceof File))throw Error('Choose an image or video.');
   const content=new Uint8Array(await file.arrayBuffer());const ext=validateMedia(content,file.type,file.name);
   const path=user.id+'/'+crypto.randomUUID()+'.'+ext;
   const uploaded=await admin.storage.from('connectx-media').upload(path,content,{contentType:file.type,upsert:false});if(uploaded.error)throw uploaded.error;
   return json({path});
  }
  if(path==='export'){
   const output:Record<string,unknown>={exported_at:new Date().toISOString()};
   for(const [table,column] of [['cx_profiles','id'],['cx_posts','author_id'],['cx_reactions','user_id'],['cx_follows','follower_id'],['cx_members','user_id'],['cx_settings','user_id']]){
    const all:unknown[]=[];
    for(let offset=0;;offset+=500){const result=await db.from(table).select('*').eq(column,user.id).range(offset,offset+499);if(result.error)throw result.error;all.push(...result.data);if(result.data.length<500)break;}
    output[table.replace('cx_','')]=all;
   }
   return new Response(JSON.stringify(output,null,2),{headers:{...headers,'Content-Disposition':'attachment; filename="connectx-account.json"'}});
  }
  if(path==='delete'){
   const body=await boundedBody(request,4096);const payload=JSON.parse(new TextDecoder().decode(body));
   if(payload.confirmation!=='DELETE')throw Error('Deletion confirmation is required.');
   const [communities,role]=await Promise.all([db.from('cx_communities').select('id').eq('owner_id',user.id).limit(1),db.from('cx_roles').select('role').eq('user_id',user.id).single()]);
   if(communities.error||role.error)throw Error('Unable to check account ownership.');
   if(communities.data?.length||role.data?.role==='owner')throw Error('Transfer community and platform ownership before deleting your account.');
   const deactivated=await admin.from('cx_profiles').update({status:'deactivated'}).eq('id',user.id);if(deactivated.error)throw deactivated.error;
   for(;;){const files=await admin.storage.from('connectx-media').list(user.id,{limit:100});if(files.error)throw files.error;if(!files.data.length)break;const result=await admin.storage.from('connectx-media').remove(files.data.map(f=>user.id+'/'+f.name));if(result.error)throw result.error;}
   const servers=await admin.from('cx_servers').delete().eq('owner_id',user.id);if(servers.error)throw servers.error;
   const revoke=await admin.auth.admin.signOut(token,'global');if(revoke.error)throw revoke.error;
   const deleted=await admin.auth.admin.deleteUser(user.id);if(deleted.error)throw deleted.error;
   return json({deleted:true});
  }
  // Optional Minecraft lookup is not proof that the player owns the account.
  const endpoint=Deno.env.get('MINECRAFT_LOOKUP_URL');
  if(!endpoint)throw Error('Minecraft skin lookup is not configured. Your self-declared username can still be saved.');
  if(!/^[A-Za-z0-9_]{3,16}$/.test(profile.minecraft_username))throw Error('Save a valid Minecraft username first.');
  const limited=await db.rpc('cx_upload_check');if(limited.error)throw limited.error;
  const lookup=new URL(endpoint);if(lookup.protocol!=='https:')throw Error('Lookup requires HTTPS.');lookup.searchParams.set('username',profile.minecraft_username);
  const key=Deno.env.get('MINECRAFT_LOOKUP_TOKEN');
  const response=await fetch(lookup,{headers:key?{Authorization:'Bearer '+key}:{},redirect:'error',signal:AbortSignal.timeout(5000)});
  if(!response.ok)throw Error('Minecraft lookup failed.');
  const identity=await response.json();
  if(typeof identity.username!=='string'||identity.username.toLowerCase()!==profile.minecraft_username.toLowerCase()||typeof identity.uuid!=='string'||!/^[a-f0-9]{32}$/i.test(identity.uuid.replaceAll('-','')))throw Error('Invalid identity response.');
  for(const value of [identity.skinUrl,identity.capeUrl])if(value){const texture=new URL(value);if(texture.protocol!=='https:'||texture.hostname!=='textures.minecraft.net')throw Error('Invalid texture URL.');}
  const updated=await admin.from('cx_profiles').update({minecraft_uuid:identity.uuid.replaceAll('-',''),skin_url:identity.skinUrl||null,cape_url:identity.capeUrl||null,identity_verified:false}).eq('id',user.id).eq('minecraft_username',profile.minecraft_username);if(updated.error)throw updated.error;
  return json({updated:true,verified:false});
 }catch(error){return json({error:error instanceof Error?error.message:(error as {message?:string})?.message||'Request failed.'},400);}
});

async function boundedBody(request:Request,limit:number){
 if(Number(request.headers.get('Content-Length'))>limit)throw Error('Request is too large.');
 const reader=request.body?.getReader();if(!reader)throw Error('Request body is required.');
 const chunks:Uint8Array[]=[];let length=0;
 for(;;){const {value,done}=await reader.read();if(done)break;length+=value.length;if(length>limit){await reader.cancel();throw Error('Request is too large.');}chunks.push(value);}
 const result=new Uint8Array(length);let offset=0;for(const chunk of chunks){result.set(chunk,offset);offset+=chunk.length;}return result;
}
