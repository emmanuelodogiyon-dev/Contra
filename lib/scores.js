import { getSupabase } from './supabase'

export async function saveScore(score){
  const supabase=getSupabase(); if(!supabase) return
  const { data:{ user } }=await supabase.auth.getUser()
  if(!user) return
  await supabase.from('scores').insert({user_id:user.id,score:Math.max(0,Math.floor(score))})
}
