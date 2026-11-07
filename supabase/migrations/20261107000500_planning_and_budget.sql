-- Planning (checklist) and budget.

create table public.task_templates (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  title text not null,
  description text,
  category text not null,
  -- Days relative to the wedding date (negative = before). Drives the time-to-go bucket.
  offset_days integer not null,
  -- Optional targeting so onboarding can personalise the list.
  applies_when jsonb not null default '{}',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  template_id uuid references public.task_templates (id) on delete set null,
  parent_task_id uuid references public.tasks (id) on delete cascade,
  title text not null check (length(title) between 1 and 200),
  notes text,
  category text not null default 'general',
  due_mode text not null default 'relative' check (due_mode in ('relative', 'fixed', 'none')),
  offset_days integer,
  due_date date,
  status text not null default 'open' check (status in ('open', 'done')),
  completed_at timestamptz,
  completed_by uuid references auth.users (id),
  wedding_vendor_id uuid,
  budget_item_id uuid,
  sort_order integer not null default 0,
  created_by uuid references auth.users (id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (due_mode <> 'relative' or offset_days is not null),
  check ((status = 'done') = (completed_at is not null))
);

create index tasks_wedding_due_idx on public.tasks (wedding_id, status, due_date) where deleted_at is null;

create table public.task_assignees (
  task_id uuid not null references public.tasks (id) on delete cascade,
  member_id uuid not null references public.wedding_members (id) on delete cascade,
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  primary key (task_id, member_id)
);

create index task_assignees_member_idx on public.task_assignees (member_id);

create trigger tasks_updated_at before update on public.tasks
  for each row execute function app_private.set_updated_at();

-- A contributor (or anyone) assigned to a task.
create or replace function app_private.is_task_assignee(p_task_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.task_assignees ta
    join public.wedding_members m on m.id = ta.member_id
    where ta.task_id = p_task_id and m.user_id = auth.uid() and m.deleted_at is null
  );
$$;

------------------------------------------------------------------------------
-- Budget
------------------------------------------------------------------------------

create table public.budget_categories (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  key text,
  name text not null check (length(name) between 1 and 100),
  -- Suggested share of the total budget in basis points (10000 = 100%).
  planned_bps integer check (planned_bps between 0 and 10000),
  planned_minor public.money_minor,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (wedding_id, key)
);

create table public.contributors (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  name text not null check (length(name) between 1 and 100),
  pledged_minor public.money_minor,
  currency public.currency_code not null,
  notes text,
  created_at timestamptz not null default now()
);

create table public.budget_items (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  category_id uuid not null references public.budget_categories (id) on delete cascade,
  name text not null check (length(name) between 1 and 200),
  currency public.currency_code not null,
  estimated_minor public.money_minor not null default 0,
  actual_minor public.money_minor,
  -- Per-guest items: total = unit price x headcount of the linked event(s).
  is_per_guest boolean not null default false,
  unit_minor public.money_minor,
  child_unit_minor public.money_minor,
  event_id uuid references public.events (id) on delete set null,
  contributor_id uuid references public.contributors (id) on delete set null,
  wedding_vendor_id uuid,
  notes text,
  sort_order integer not null default 0,
  created_by uuid references auth.users (id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (not is_per_guest or unit_minor is not null)
);

create index budget_items_wedding_idx on public.budget_items (wedding_id, category_id);

-- Payments made outside the platform (in-app payments arrive in Phase 3).
create table public.expense_payments (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  budget_item_id uuid not null references public.budget_items (id) on delete cascade,
  amount_minor public.money_minor not null check (amount_minor > 0),
  currency public.currency_code not null,
  paid_on date not null default current_date,
  contributor_id uuid references public.contributors (id) on delete set null,
  receipt_path text,
  notes text,
  created_by uuid references auth.users (id) default auth.uid(),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.tasks
  add constraint tasks_budget_item_fk foreign key (budget_item_id)
  references public.budget_items (id) on delete set null;

create trigger budget_categories_updated_at before update on public.budget_categories
  for each row execute function app_private.set_updated_at();
create trigger budget_items_updated_at before update on public.budget_items
  for each row execute function app_private.set_updated_at();

------------------------------------------------------------------------------
-- RLS
------------------------------------------------------------------------------

alter table public.task_templates enable row level security;
alter table public.tasks enable row level security;
alter table public.task_assignees enable row level security;
alter table public.budget_categories enable row level security;
alter table public.contributors enable row level security;
alter table public.budget_items enable row level security;
alter table public.expense_payments enable row level security;

create policy task_templates_select on public.task_templates
  for select to authenticated using (true);
create policy task_templates_write_staff on public.task_templates
  for all to authenticated
  using ((select app_private.is_staff(array['support'])))
  with check ((select app_private.is_staff(array['support'])));

-- Tasks: module access, plus assignees (e.g. contributors) see and update their own tasks.
create policy tasks_select on public.tasks
  for select to authenticated
  using (
    (select app_private.has_wedding_access(wedding_id, 'tasks', 'view'))
    or (select app_private.is_task_assignee(id))
  );
create policy tasks_insert on public.tasks
  for insert to authenticated
  with check ((select app_private.has_wedding_access(wedding_id, 'tasks', 'edit')));
create policy tasks_update on public.tasks
  for update to authenticated
  using (
    (select app_private.has_wedding_access(wedding_id, 'tasks', 'edit'))
    or (select app_private.is_task_assignee(id))
  )
  with check (
    (select app_private.has_wedding_access(wedding_id, 'tasks', 'edit'))
    or (select app_private.is_task_assignee(id))
  );
create policy tasks_delete on public.tasks
  for delete to authenticated
  using ((select app_private.has_wedding_access(wedding_id, 'tasks', 'edit')));

create policy task_assignees_select on public.task_assignees
  for select to authenticated
  using (
    (select app_private.has_wedding_access(wedding_id, 'tasks', 'view'))
    or member_id = (select app_private.member_id_for(wedding_id))
  );
create policy task_assignees_write on public.task_assignees
  for all to authenticated
  using ((select app_private.has_wedding_access(wedding_id, 'tasks', 'edit')))
  with check ((select app_private.has_wedding_access(wedding_id, 'tasks', 'edit')));

do $$
declare
  t text;
begin
  foreach t in array array['budget_categories', 'contributors', 'budget_items', 'expense_payments'] loop
    execute format(
      'create policy %1$s_select on public.%1$I for select to authenticated
         using ((select app_private.has_wedding_access(wedding_id, ''budget'', ''view'')))', t);
    execute format(
      'create policy %1$s_write on public.%1$I for all to authenticated
         using ((select app_private.has_wedding_access(wedding_id, ''budget'', ''edit'')))
         with check ((select app_private.has_wedding_access(wedding_id, ''budget'', ''edit'')))', t);
  end loop;
end;
$$;

create trigger expense_payments_audit after insert or update or delete on public.expense_payments
  for each row execute function app_private.audit_row();
