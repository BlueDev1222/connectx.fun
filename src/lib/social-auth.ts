import {browserDb} from './supabase';
import {supabaseKey,supabaseUrl} from './public-config';
export const socialProviders = [
 {id:'discord',label:'Discord',scopes:'identify email'},
 {id:'apple',label:'Apple',scopes:'name email'},
 {id:'azure',label:'Microsoft',scopes:'email'},
 {id:'google',label:'Google',scopes:'openid email profile'},
] as const;
export type SocialProvider = typeof socialProviders[number];
export async function signInWithSocial(provider:SocialProvider){
 const response=await fetch(supabaseUrl+'/auth/v1/settings',{headers:{apikey:supabaseKey},signal:AbortSignal.timeout(8000)});
 if(!response.ok)throw Error('Unable to start sign-in. Try again or use email.');
 const settings=await response.json();
 if(!settings.external?.[provider.id])throw Error(provider.label+' sign-in is not available yet. Please use email for now.');
 const {error}=await browserDb().auth.signInWithOAuth({provider:provider.id,options:{redirectTo:window.location.origin+'/?flow='+provider.id,scopes:provider.scopes}});
 if(error)throw error;
}
