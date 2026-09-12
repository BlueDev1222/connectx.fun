import {browserDb} from './supabase';
import {supabaseKey,supabaseUrl} from './public-config';
export async function signInWithDiscord(){
 const response=await fetch(supabaseUrl+'/auth/v1/settings',{headers:{apikey:supabaseKey},signal:AbortSignal.timeout(8000)});
 if(!response.ok)throw Error('Unable to start Discord sign-in. Try again or use email.');
 const settings=await response.json();
 if(!settings.external?.discord)throw Error('Discord sign-in is not available yet. Please use email for now.');
 const {error}=await browserDb().auth.signInWithOAuth({provider:'discord',options:{redirectTo:window.location.origin+'/?flow=discord',scopes:'identify email'}});
 if(error)throw error;
}
