/* Optional authenticated persistence. A dedicated Supabase project is required.
   The publishable key is not a secret; never use a service_role/secret key here.
   No ChatGPT raw transcripts or GitHub credentials are stored in cloud snapshots.
*/
export const CLOUD_CONFIG_KEY='personal-command-center.cloud-config.v2';
const CONFIG_RE=/^https:\/\/[a-z0-9-]+\.supabase\.co$/i;
let client=null,currentConfig=null;
function getJSON(k,fallback){try{return JSON.parse(localStorage.getItem(k)||'null')||fallback}catch(_){return fallback}}
export function cloudConfig(){return getJSON(CLOUD_CONFIG_KEY,null);}
export function validateConfig(config){
 if(!config||!CONFIG_RE.test(String(config.url||'')))throw Error('Use an official https://YOUR-REF.supabase.co project URL.');
 const key=String(config.publishableKey||'');
 if(key.startsWith('sb_secret_')||key.includes('service_role'))throw Error('Never use a secret/service-role key in the browser.');
 if(!key.startsWith('sb_publishable_')&&!/^eyJ[A-Za-z0-9_-]{70,}$/.test(key))
   throw Error('Use the Supabase publishable key (sb_publishable_...) or legacy anon key.');
 return {url:config.url.replace(/\/$/,''),publishableKey:key};
}
export async function configureCloud(config){
 currentConfig=validateConfig(config);
 localStorage.setItem(CLOUD_CONFIG_KEY,JSON.stringify(currentConfig));
 client=null;
 return getCloud();
}
export async function getCloud(){
 const config=currentConfig||cloudConfig();
 if(!config)return null;
 validateConfig(config);
 if(client)return client;
 // Load only when the user configures cloud storage. Pinned stable SDK version.
 const {createClient}=await import('https://esm.sh/@supabase/supabase-js@2.117.3?bundle');
 client=createClient(config.url,config.publishableKey,{
  auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:'pkce'}
 });
 return client;
}
export async function cloudUser(){
 const c=await getCloud();if(!c)return null;
 const {data,error}=await c.auth.getUser();
 if(error)return null;return data?.user||null;
}
export async function signInCloud(){
 const c=await getCloud();if(!c)throw Error('Configure cloud connection first.');
 const redirectTo=location.origin+location.pathname;
 const {error}=await c.auth.signInWithOAuth({provider:'github',options:{redirectTo}});
 if(error)throw error;
}
export async function signOutCloud(){
 const c=await getCloud();if(!c)return;
 const {error}=await c.auth.signOut();if(error)throw error;
}
export async function loadCloud(){
 const c=await getCloud();if(!c)throw Error('Configure cloud storage first.');
 const user=await cloudUser();if(!user)throw Error('Sign in to your cloud account.');
 const {data,error}=await c.from('pcc_snapshots').select('document,revision,updated_at').eq('owner_id',user.id).maybeSingle();
 if(error)throw error;
 return data||null;
}
export async function saveCloud(document,expectedRevision){
 const c=await getCloud();if(!c)throw Error('Cloud is not configured.');
 const user=await cloudUser();if(!user)throw Error('Sign in to your cloud account.');
 if(!document||typeof document!=='object'||Array.isArray(document))throw Error('Snapshot must be a JSON object.');
 // Require revision from the preceding download; null only creates first snapshot.
 const {data,error}=await c.rpc('pcc_save_snapshot',{p_document:document,p_expected_revision:expectedRevision==null?null:expectedRevision});
 if(error)throw error;
 return data;
}
