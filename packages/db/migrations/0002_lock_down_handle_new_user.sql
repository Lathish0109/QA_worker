-- The profile-creation trigger function is SECURITY DEFINER and lived in
-- the public schema, so PostgREST auto-exposed it as a callable RPC
-- (/rest/v1/rpc/handle_new_user) for anon and authenticated roles. It's
-- only meant to be invoked by the on_auth_user_created trigger — revoke
-- direct execute access.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
