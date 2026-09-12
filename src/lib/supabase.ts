import {createClient,type SupabaseClient} from '@supabase/supabase-js';
import {supabaseUrl,supabaseKey} from './public-config';
export const configured=Boolean(supabaseUrl&&supabaseKey);
let client:SupabaseClient|undefined;
export function browserDb(){return client??=createClient(supabaseUrl,supabaseKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:'pkce'}})}
