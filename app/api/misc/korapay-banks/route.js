import { NextResponse } from 'next/server'
import { getKoraSecret,KORA_API } from '../../../../lib/server/korapay'
export const runtime='nodejs'
export async function GET(){try{const r=await fetch(KORA_API+'/misc/banks?countryCode=NG',{headers:{Authorization:'Bearer '+getKoraSecret()},cache:'no-store'});const d=await r.json();if(!r.ok||d.status!==true)throw new Error('Bank list unavailable');return NextResponse.json({banks:d.data||[]})}catch(e){console.error('Kora bank list:',e.message);return NextResponse.json({error:'Bank list is temporarily unavailable.'},{status:503})}}
