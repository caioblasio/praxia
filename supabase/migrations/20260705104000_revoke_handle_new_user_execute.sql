-- handle_new_user is only invoked by the auth.users trigger, not via RPC.
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon, authenticated;
