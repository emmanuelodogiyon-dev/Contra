-- Award a prize and write its ledger/audit rows in one transaction.
-- The API calls this only after checking the administrator allowlist.
create or replace function public.admin_award_tournament_prize(
  p_result_id uuid,
  p_amount_minor bigint,
  p_actor uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result public.tournament_results%rowtype;
begin
  if p_amount_minor < 100 or p_amount_minor > 10000000000 then
    raise exception 'Invalid prize amount';
  end if;

  select * into v_result
  from public.tournament_results
  where id = p_result_id
  for update;

  if not found then raise exception 'Result not found'; end if;
  if v_result.verification_status <> 'approved' then
    raise exception 'Only an approved result can receive a prize';
  end if;
  if v_result.awarded_at is not null then
    raise exception 'Prize has already been awarded';
  end if;
  if v_result.reviewed_by is null or v_result.reviewed_by = p_actor then
    raise exception 'Prize awarder must differ from score reviewer';
  end if;

  insert into public.tournament_ledger (
    tournament_id, user_id, kind, amount_minor, currency, reference, description
  ) values (
    v_result.tournament_id, v_result.user_id, 'prize_award',
    p_amount_minor, 'NGN', 'PRIZE-' || v_result.id::text,
    'Admin-approved tournament prize'
  );

  update public.tournament_results
  set payout_amount_minor = p_amount_minor, awarded_at = now()
  where id = p_result_id;

  insert into public.tournament_audit_log (
    actor_user_id, action, target_type, target_id, metadata
  ) values (
    p_actor, 'award_prize', 'tournament_result', p_result_id::text,
    jsonb_build_object('amount_minor', p_amount_minor)
  );

  return jsonb_build_object('awarded', true, 'result_id', p_result_id);
end;
$$;

revoke all on function public.admin_award_tournament_prize(uuid,bigint,uuid) from public, anon, authenticated;
grant execute on function public.admin_award_tournament_prize(uuid,bigint,uuid) to service_role;
