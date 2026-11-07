-- Collaborator roles and per-module visibility inside one wedding.
begin;
\ir _helpers/helpers.psql

select plan(20);

select tests.create_user('owner@example.test') as owner \gset
select tests.create_user('partner@example.test') as partner \gset
select tests.create_user('mum@example.test') as mum \gset
select tests.create_user('bridesmaid@example.test') as maid \gset
select tests.create_user('planner@example.test') as planner \gset
select tests.create_user('extra@example.test') as extra \gset

select tests.authenticate_as(:'owner');
select public.create_wedding('Owner', 'Partner', 'GBP', 'Europe/London') as w \gset

-- Invite the partner as second owner via a token, as the app will.
insert into public.member_invites (wedding_id, token_hash, role, relation)
values (:'w', app_private.hash_token('partner-token'), 'owner', 'partner');
-- Mum: viewer with the budget hidden.
insert into public.member_invites (wedding_id, token_hash, role, relation, module_access)
values (:'w', app_private.hash_token('mum-token'), 'viewer', 'family', '{"budget": "none"}');
-- Bridesmaid: contributor, no modules granted.
insert into public.member_invites (wedding_id, token_hash, role, relation)
values (:'w', app_private.hash_token('maid-token'), 'contributor', 'wedding_party');
-- Planner: editor.
insert into public.member_invites (wedding_id, token_hash, role, relation)
values (:'w', app_private.hash_token('planner-token'), 'editor', 'planner');

insert into public.budget_categories (wedding_id, name) values (:'w', 'Flowers') returning id as cat \gset
insert into public.households (wedding_id, display_name) values (:'w', 'The Joneses') returning id as hh \gset
insert into public.tasks (wedding_id, title, offset_days) values (:'w', 'Choose dresses', -180) returning id as task_maid \gset
insert into public.tasks (wedding_id, title, offset_days) values (:'w', 'Book caterer', -300) returning id as task_other \gset

select tests.authenticate_as(:'partner');
select is(public.accept_member_invite('partner-token'), :'w'::uuid, 'partner accepts invite');
select throws_ok($$select public.accept_member_invite('partner-token')$$, 'P0002', null, 'invite cannot be reused');
select tests.authenticate_as(:'mum');
select lives_ok($$select public.accept_member_invite('mum-token')$$, 'mum accepts invite');
select tests.authenticate_as(:'maid');
select lives_ok($$select public.accept_member_invite('maid-token')$$, 'bridesmaid accepts invite');
select tests.authenticate_as(:'planner');
select lives_ok($$select public.accept_member_invite('planner-token')$$, 'planner accepts invite');

-- Assign the bridesmaid to one task.
select tests.authenticate_as(:'owner');
insert into public.task_assignees (task_id, member_id, wedding_id)
select :'task_maid', m.id, :'w' from public.wedding_members m where m.user_id = :'maid';

-- Second owner can edit the budget.
select tests.authenticate_as(:'partner');
select isnt_empty(format($$update public.budget_categories set name = 'Florals' where id = %L returning id$$, :'cat'),
  'second owner edits budget');

-- Viewer with budget hidden.
select tests.authenticate_as(:'mum');
select is((select count(*)::int from public.budget_categories), 0, 'viewer cannot see hidden budget');
select is((select count(*)::int from public.households), 1, 'viewer can see guests');
select throws_ok(
  format($$insert into public.households (wedding_id, display_name) values (%L, 'x')$$, :'w'),
  '42501', null, 'viewer cannot add guests');
select is_empty(format($$update public.tasks set title = 'x' where id = %L returning id$$, :'task_other'),
  'viewer cannot edit tasks');

-- Contributor sees only assigned tasks and nothing else.
select tests.authenticate_as(:'maid');
select is((select array_agg(id) from public.tasks), array[:'task_maid'::uuid], 'contributor sees only their task');
select isnt_empty(
  format($$update public.tasks set status = 'done', completed_at = now() where id = %L returning id$$, :'task_maid'),
  'contributor can complete their task');
select is((select count(*)::int from public.households), 0, 'contributor cannot see guests');
select is((select count(*)::int from public.budget_items), 0, 'contributor cannot see budget');
select is((select count(*)::int from public.weddings), 1, 'contributor can see the wedding itself');

-- Editor (planner) can edit but cannot manage members.
select tests.authenticate_as(:'planner');
select isnt_empty(format($$update public.tasks set title = 'Book caterer now' where id = %L returning id$$, :'task_other'),
  'editor can edit tasks');
select throws_ok(
  format($$insert into public.member_invites (wedding_id, token_hash, role) values (%L, 'p', 'viewer')$$, :'w'),
  '42501', null, 'editor cannot invite members');
select is_empty(format($$update public.wedding_members set role = 'owner' where user_id = %L returning id$$, :'planner'),
  'editor cannot promote themselves');

-- Owner limits: a third owner is rejected at commit (deferred constraint, forced here).
select tests.authenticate_as(:'owner');
insert into public.member_invites (wedding_id, token_hash, role) values (:'w', app_private.hash_token('extra-token'), 'owner');
select tests.authenticate_as(:'extra');
select public.accept_member_invite('extra-token');
select throws_ok($$set constraints all immediate$$, '23514', 'A wedding can have at most two owners', 'third owner rejected');

-- Membership changes are audited (checked as superuser).
select tests.clear_authentication();
select ok((select count(*) from public.audit_log where table_name = 'wedding_members' and wedding_id = :'w') >= 5,
  'membership changes are written to the audit log');

select * from finish();
rollback;
