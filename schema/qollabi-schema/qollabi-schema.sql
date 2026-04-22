--
-- PostgreSQL database dump
--

-- Dumped from database version 17.2
-- Dumped by pg_dump version 17.2

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: drizzle; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA drizzle;


--
-- Name: kv; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA kv;


--
-- Name: worker; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA worker;


--
-- Name: domain_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.domain_status AS ENUM (
    'pending',
    'verified',
    'failed'
);


--
-- Name: sender_email_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.sender_email_status AS ENUM (
    'pending',
    'verified',
    'failed'
);


--
-- Name: job_spec; Type: TYPE; Schema: worker; Owner: -
--

CREATE TYPE worker.job_spec AS (
	identifier text,
	payload json,
	queue_name text,
	run_at timestamp with time zone,
	max_attempts smallint,
	job_key text,
	priority smallint,
	flags text[]
);


--
-- Name: create_multi_tenant_view(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_multi_tenant_view(materialized_view_name text, column_name text DEFAULT 'workspaceId'::text) RETURNS void
    LANGUAGE plpgsql
    AS $$
    DECLARE
        view_name TEXT;
    BEGIN
        view_name := replace(materialized_view_name, 'materialized_', '');

        EXECUTE format('DROP VIEW IF EXISTS %I;', view_name);

        EXECUTE format('
            CREATE VIEW %I AS
            SELECT *
            FROM %I
            WHERE 
                (current_setting(''app.current_workspace_id'', true) IS NOT NULL 
                    AND %I = current_setting(''app.current_workspace_id'', true))
                OR current_setting(''app.current_workspace_id'', true) IS NULL;
        ', view_name, materialized_view_name, column_name);

        -- Changed to RAISE DEBUG to silence notices
        RAISE DEBUG 'Secure view % has been created from materialized view % using column %.',
                     view_name, materialized_view_name, column_name;
    EXCEPTION
        WHEN undefined_table THEN
            RAISE EXCEPTION 'Materialized view % does not exist', materialized_view_name;
        WHEN undefined_column THEN
            RAISE EXCEPTION 'Column % does not exist in materialized view %', column_name, materialized_view_name;
        WHEN others THEN
            RAISE EXCEPTION 'Failed to create view % from materialized view %: %',
                            view_name, materialized_view_name, SQLERRM;
    END;
    $$;


--
-- Name: disable_multi_tenant_rls_policy(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.disable_multi_tenant_rls_policy(table_name text, column_name text DEFAULT 'workspaceId'::text) RETURNS void
    LANGUAGE plpgsql
    AS $$
    DECLARE
        policy_name text;
    BEGIN
        -- Generate the policy name based on the table name
        policy_name := table_name || '_isolation_policy';

        -- Drop the policy first (must be done before disabling RLS)
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I;', policy_name, table_name);

        -- Disable FORCE ROW LEVEL SECURITY
        EXECUTE format('ALTER TABLE %I NO FORCE ROW LEVEL SECURITY;', table_name);

        -- Disable RLS on the specified table
        EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY;', table_name);

        -- Changed to RAISE DEBUG to silence notices
        RAISE DEBUG 'RLS policy % on table % has been disabled and RLS has been turned off.', 
                     policy_name, table_name;
    EXCEPTION
        WHEN others THEN
            RAISE WARNING 'Failed to disable RLS policy % on table %: %', policy_name, table_name, SQLERRM;
    END;
    $$;


--
-- Name: drop_multi_tenant_view(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.drop_multi_tenant_view(materialized_view_name text, column_name text DEFAULT 'workspaceId'::text) RETURNS void
    LANGUAGE plpgsql
    AS $$
    DECLARE
        view_name TEXT;
    BEGIN
        -- Generate the view name by removing 'materialized_' prefix
        view_name := replace(materialized_view_name, 'materialized_', '');

        -- Drop the view if it exists
        EXECUTE format('DROP VIEW IF EXISTS %I;', view_name);

        -- Changed to RAISE DEBUG to silence notices
        RAISE DEBUG 'Multi-tenant view % has been dropped (was created from materialized view %).',
                     view_name, materialized_view_name;
    EXCEPTION
        WHEN others THEN
            RAISE WARNING 'Failed to drop view %: %', view_name, SQLERRM;
    END;
    $$;


--
-- Name: enable_multi_tenant_rls_policy(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.enable_multi_tenant_rls_policy(table_name text, column_name text DEFAULT 'workspaceId'::text) RETURNS void
    LANGUAGE plpgsql
    AS $$
    DECLARE
        policy_name text;
    BEGIN
        -- Generate the policy name based on the table name
        policy_name := table_name || '_isolation_policy';

        -- Enable RLS on the specified table AND force it for all users
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', table_name);
        EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY;', table_name);

        -- Drop existing policy if it exists
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I;', policy_name, table_name);

        -- Create the RLS policy with the generated policy name
        -- This policy allows access when:
        -- 1. The parameter doesn't exist or is NULL
        -- 2. The parameter matches the column value
        EXECUTE format(
            'CREATE POLICY %I ON %I FOR ALL TO PUBLIC USING (
                (current_setting(''app.current_workspace_id'', TRUE)::TEXT IS NULL) OR
                (%I = current_setting(''app.current_workspace_id'', TRUE)::TEXT)
            );',
            policy_name, table_name, column_name
        );
    
        -- Changed to RAISE DEBUG to silence notices
        RAISE DEBUG 'RLS policy % on table % has been created using column % and FORCE ROW LEVEL SECURITY enabled.',
                     policy_name, table_name, column_name;
    EXCEPTION
        WHEN others THEN
            RAISE WARNING 'Failed to create RLS policy % on table %: %', policy_name, table_name, SQLERRM;
    END;
    $$;


--
-- Name: get_categories_tree(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_categories_tree(category_id text) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
    DECLARE
        result JSONB;
        child_record RECORD;
        children_array JSONB := '[]'::JSONB;
        child_node JSONB;
    BEGIN
        -- Get children for this category
        FOR child_record IN
            SELECT id, name, description, color, icon, "createdAt", "updatedAt"
            FROM public.categories 
            WHERE "parentId" = category_id
            ORDER BY name
        LOOP
            child_node := public.get_categories_tree(child_record.id);
            children_array := children_array || child_node;
        END LOOP;
        
        -- Build the current node
        SELECT JSON_BUILD_OBJECT(
            'id', c.id,
            'name', c.name,
            'description', c.description,
            'color', c.color,
            'icon', c.icon,
            'createdAt', c."createdAt",
            'updatedAt', c."updatedAt",
            'subcategories', children_array
        )::JSONB INTO result
        FROM public.categories c
        WHERE c.id = category_id;
        
        RETURN result;
    END;
    $$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _private_jobs; Type: TABLE; Schema: worker; Owner: -
--

CREATE TABLE worker._private_jobs (
    id bigint NOT NULL,
    job_queue_id integer,
    task_id integer NOT NULL,
    payload json DEFAULT '{}'::json NOT NULL,
    priority smallint DEFAULT 0 NOT NULL,
    run_at timestamp with time zone DEFAULT now() NOT NULL,
    attempts smallint DEFAULT 0 NOT NULL,
    max_attempts smallint DEFAULT 25 NOT NULL,
    last_error text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    key text,
    locked_at timestamp with time zone,
    locked_by text,
    revision integer DEFAULT 0 NOT NULL,
    flags jsonb,
    is_available boolean GENERATED ALWAYS AS (((locked_at IS NULL) AND (attempts < max_attempts))) STORED NOT NULL,
    CONSTRAINT jobs_key_check CHECK (((length(key) > 0) AND (length(key) <= 512))),
    CONSTRAINT jobs_max_attempts_check CHECK ((max_attempts >= 1))
);


--
-- Name: add_job(text, json, text, timestamp with time zone, integer, text, integer, text[], text); Type: FUNCTION; Schema: worker; Owner: -
--

CREATE FUNCTION worker.add_job(identifier text, payload json DEFAULT NULL::json, queue_name text DEFAULT NULL::text, run_at timestamp with time zone DEFAULT NULL::timestamp with time zone, max_attempts integer DEFAULT NULL::integer, job_key text DEFAULT NULL::text, priority integer DEFAULT NULL::integer, flags text[] DEFAULT NULL::text[], job_key_mode text DEFAULT 'replace'::text) RETURNS worker._private_jobs
    LANGUAGE plpgsql
    AS $$
declare
  v_job "worker"._private_jobs;
begin
  if (job_key is null or job_key_mode is null or job_key_mode in ('replace', 'preserve_run_at')) then
    select * into v_job
    from "worker".add_jobs(
      ARRAY[(
        identifier,
        payload,
        queue_name,
        run_at,
        max_attempts::smallint,
        job_key,
        priority::smallint,
        flags
      )::"worker".job_spec],
      (job_key_mode = 'preserve_run_at')
    )
    limit 1;
    return v_job;
  elsif job_key_mode = 'unsafe_dedupe' then
    -- Ensure all the tasks exist
    insert into "worker"._private_tasks as tasks (identifier)
    values (add_job.identifier)
    on conflict do nothing;
    -- Ensure all the queues exist
    if add_job.queue_name is not null then
      insert into "worker"._private_job_queues as job_queues (queue_name)
      values (add_job.queue_name)
      on conflict do nothing;
    end if;
    -- Insert job, but if one already exists then do nothing, even if the
    -- existing job has already started (and thus represents an out-of-date
    -- world state). This is dangerous because it means that whatever state
    -- change triggered this add_job may not be acted upon (since it happened
    -- after the existing job started executing, but no further job is being
    -- scheduled), but it is useful in very rare circumstances for
    -- de-duplication. If in doubt, DO NOT USE THIS.
    insert into "worker"._private_jobs as jobs (
      job_queue_id,
      task_id,
      payload,
      run_at,
      max_attempts,
      key,
      priority,
      flags
    )
      select
        job_queues.id,
        tasks.id,
        coalesce(add_job.payload, '{}'::json),
        coalesce(add_job.run_at, now()),
        coalesce(add_job.max_attempts::smallint, 25::smallint),
        add_job.job_key,
        coalesce(add_job.priority::smallint, 0::smallint),
        (
          select jsonb_object_agg(flag, true)
          from unnest(add_job.flags) as item(flag)
        )
      from "worker"._private_tasks as tasks
      left join "worker"._private_job_queues as job_queues
      on job_queues.queue_name = add_job.queue_name
      where tasks.identifier = add_job.identifier
    on conflict (key)
      -- Bump the updated_at so that there's something to return
      do update set
        revision = jobs.revision + 1,
        updated_at = now()
      returning *
      into v_job;
    if v_job.revision = 0 then
      perform pg_notify('jobs:insert', '{"r":' || random()::text || ',"count":1}');
    end if;
    return v_job;
  else
    raise exception 'Invalid job_key_mode value, expected ''replace'', ''preserve_run_at'' or ''unsafe_dedupe''.' using errcode = 'GWBKM';
  end if;
end;
$$;


--
-- Name: add_jobs(worker.job_spec[], boolean); Type: FUNCTION; Schema: worker; Owner: -
--

CREATE FUNCTION worker.add_jobs(specs worker.job_spec[], job_key_preserve_run_at boolean DEFAULT false) RETURNS SETOF worker._private_jobs
    LANGUAGE plpgsql
    AS $$
begin
  -- Ensure all the tasks exist
  insert into "worker"._private_tasks as tasks (identifier)
  select distinct spec.identifier
  from unnest(specs) spec
  on conflict do nothing;
  -- Ensure all the queues exist
  insert into "worker"._private_job_queues as job_queues (queue_name)
  select distinct spec.queue_name
  from unnest(specs) spec
  where spec.queue_name is not null
  on conflict do nothing;
  -- Ensure any locked jobs have their key cleared - in the case of locked
  -- existing job create a new job instead as it must have already started
  -- executing (i.e. it's world state is out of date, and the fact add_job
  -- has been called again implies there's new information that needs to be
  -- acted upon).
  update "worker"._private_jobs as jobs
  set
    key = null,
    attempts = jobs.max_attempts,
    updated_at = now()
  from unnest(specs) spec
  where spec.job_key is not null
  and jobs.key = spec.job_key
  and is_available is not true;

  -- WARNING: this count is not 100% accurate; 'on conflict' clause will cause it to be an overestimate
  perform pg_notify('jobs:insert', '{"r":' || random()::text || ',"count":' || array_length(specs, 1)::text || '}');

  -- TODO: is there a risk that a conflict could occur depending on the
  -- isolation level?
  return query insert into "worker"._private_jobs as jobs (
    job_queue_id,
    task_id,
    payload,
    run_at,
    max_attempts,
    key,
    priority,
    flags
  )
    select
      job_queues.id,
      tasks.id,
      coalesce(spec.payload, '{}'::json),
      coalesce(spec.run_at, now()),
      coalesce(spec.max_attempts, 25),
      spec.job_key,
      coalesce(spec.priority, 0),
      (
        select jsonb_object_agg(flag, true)
        from unnest(spec.flags) as item(flag)
      )
    from unnest(specs) spec
    inner join "worker"._private_tasks as tasks
    on tasks.identifier = spec.identifier
    left join "worker"._private_job_queues as job_queues
    on job_queues.queue_name = spec.queue_name
  on conflict (key) do update set
    job_queue_id = excluded.job_queue_id,
    task_id = excluded.task_id,
    payload =
      case
      when json_typeof(jobs.payload) = 'array' and json_typeof(excluded.payload) = 'array' then
        (jobs.payload::jsonb || excluded.payload::jsonb)::json
      else
        excluded.payload
      end,
    max_attempts = excluded.max_attempts,
    run_at = (case
      when job_key_preserve_run_at is true and jobs.attempts = 0 then jobs.run_at
      else excluded.run_at
    end),
    priority = excluded.priority,
    revision = jobs.revision + 1,
    flags = excluded.flags,
    -- always reset error/retry state
    attempts = 0,
    last_error = null,
    updated_at = now()
  where jobs.locked_at is null
  returning *;
end;
$$;


--
-- Name: complete_jobs(bigint[]); Type: FUNCTION; Schema: worker; Owner: -
--

CREATE FUNCTION worker.complete_jobs(job_ids bigint[]) RETURNS SETOF worker._private_jobs
    LANGUAGE sql
    AS $$
  delete from "worker"._private_jobs as jobs
    where id = any(job_ids)
    and (
      locked_at is null
    or
      locked_at < now() - interval '4 hours'
    )
    returning *;
$$;


--
-- Name: force_unlock_workers(text[]); Type: FUNCTION; Schema: worker; Owner: -
--

CREATE FUNCTION worker.force_unlock_workers(worker_ids text[]) RETURNS void
    LANGUAGE sql
    AS $$
update "worker"._private_jobs as jobs
set locked_at = null, locked_by = null
where locked_by = any(worker_ids);
update "worker"._private_job_queues as job_queues
set locked_at = null, locked_by = null
where locked_by = any(worker_ids);
$$;


--
-- Name: permanently_fail_jobs(bigint[], text); Type: FUNCTION; Schema: worker; Owner: -
--

CREATE FUNCTION worker.permanently_fail_jobs(job_ids bigint[], error_message text DEFAULT NULL::text) RETURNS SETOF worker._private_jobs
    LANGUAGE sql
    AS $$
  update "worker"._private_jobs as jobs
    set
      last_error = coalesce(error_message, 'Manually marked as failed'),
      attempts = max_attempts,
      updated_at = now()
    where id = any(job_ids)
    and (
      locked_at is null
    or
      locked_at < NOW() - interval '4 hours'
    )
    returning *;
$$;


--
-- Name: remove_job(text); Type: FUNCTION; Schema: worker; Owner: -
--

CREATE FUNCTION worker.remove_job(job_key text) RETURNS worker._private_jobs
    LANGUAGE plpgsql STRICT
    AS $$
declare
  v_job "worker"._private_jobs;
begin
  -- Delete job if not locked
  delete from "worker"._private_jobs as jobs
    where key = job_key
    and (
      locked_at is null
    or
      locked_at < NOW() - interval '4 hours'
    )
  returning * into v_job;
  if not (v_job is null) then
    perform pg_notify('jobs:insert', '{"r":' || random()::text || ',"count":-1}');
    return v_job;
  end if;
  -- Otherwise prevent job from retrying, and clear the key
  update "worker"._private_jobs as jobs
  set
    key = null,
    attempts = jobs.max_attempts,
    updated_at = now()
  where key = job_key
  returning * into v_job;
  return v_job;
end;
$$;


--
-- Name: reschedule_jobs(bigint[], timestamp with time zone, integer, integer, integer); Type: FUNCTION; Schema: worker; Owner: -
--

CREATE FUNCTION worker.reschedule_jobs(job_ids bigint[], run_at timestamp with time zone DEFAULT NULL::timestamp with time zone, priority integer DEFAULT NULL::integer, attempts integer DEFAULT NULL::integer, max_attempts integer DEFAULT NULL::integer) RETURNS SETOF worker._private_jobs
    LANGUAGE sql
    AS $$
  update "worker"._private_jobs as jobs
    set
      run_at = coalesce(reschedule_jobs.run_at, jobs.run_at),
      priority = coalesce(reschedule_jobs.priority::smallint, jobs.priority),
      attempts = coalesce(reschedule_jobs.attempts::smallint, jobs.attempts),
      max_attempts = coalesce(reschedule_jobs.max_attempts::smallint, jobs.max_attempts),
      updated_at = now()
    where id = any(job_ids)
    and (
      locked_at is null
    or
      locked_at < NOW() - interval '4 hours'
    )
    returning *;
$$;


--
-- Name: __drizzle_migrations; Type: TABLE; Schema: drizzle; Owner: -
--

CREATE TABLE drizzle.__drizzle_migrations (
    id integer NOT NULL,
    hash text NOT NULL,
    created_at bigint NOT NULL
);


--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE; Schema: drizzle; Owner: -
--

CREATE SEQUENCE drizzle.__drizzle_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: drizzle; Owner: -
--

ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNED BY drizzle.__drizzle_migrations.id;


--
-- Name: keyv; Type: TABLE; Schema: kv; Owner: -
--

CREATE TABLE kv.keyv (
    key character varying(255) NOT NULL,
    value text
);


--
-- Name: activity_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activity_logs (
    id text NOT NULL,
    action text NOT NULL,
    "entityType" text NOT NULL,
    "entityId" text NOT NULL,
    "userId" text,
    payload json,
    "workspaceId" text NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.activity_logs FORCE ROW LEVEL SECURITY;


--
-- Name: addresses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.addresses (
    id text NOT NULL,
    "workspaceId" text NOT NULL,
    street text,
    "houseNumber" text,
    "unitNumber" text,
    "countryId" text,
    "cityId" text,
    "postalCodeId" text,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.addresses FORCE ROW LEVEL SECURITY;


--
-- Name: anonymous_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.anonymous_users (
    id text NOT NULL,
    email text NOT NULL,
    "userId" text,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: attributes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attributes (
    id text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    "helpText" text,
    type text NOT NULL,
    options json[],
    required boolean DEFAULT false NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    internal boolean DEFAULT false NOT NULL,
    configurable boolean DEFAULT true NOT NULL,
    filterable boolean DEFAULT true NOT NULL,
    "unique" boolean DEFAULT false NOT NULL,
    "entityType" text NOT NULL,
    rank integer DEFAULT 999 NOT NULL,
    "workspaceId" text NOT NULL,
    metadata jsonb,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT attributes_entity_type_check CHECK (("entityType" = ANY (ARRAY['partner'::text, 'opportunity'::text, 'customer'::text, 'contact'::text, 'category'::text, 'user'::text, 'vendors'::text, 'product_template'::text, 'product'::text, 'workspace'::text, 'risk_object'::text, 'coverage'::text, 'lead'::text]))),
    CONSTRAINT attributes_type_check CHECK ((type = ANY (ARRAY['text'::text, 'multilineText'::text, 'number'::text, 'percent'::text, 'currency'::text, 'boolean'::text, 'date'::text, 'option'::text, 'multiOption'::text, 'color'::text, 'relational'::text])))
);

ALTER TABLE ONLY public.attributes FORCE ROW LEVEL SECURITY;


--
-- Name: campaign_contact_exclusions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.campaign_contact_exclusions (
    id text NOT NULL,
    "campaignId" text NOT NULL,
    "contactId" text,
    "customerId" text NOT NULL,
    "excludedByMemberId" text NOT NULL,
    "excludedAt" timestamp without time zone NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: campaign_custom_emails; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.campaign_custom_emails (
    id text NOT NULL,
    "campaignId" text NOT NULL,
    "contactId" text NOT NULL,
    subject text NOT NULL,
    content text NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: campaign_domains; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.campaign_domains (
    id text NOT NULL,
    "workspaceId" text NOT NULL,
    domain text NOT NULL,
    "postmarkDomainId" text,
    "dnsRecords" jsonb,
    status public.domain_status DEFAULT 'pending'::public.domain_status NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.campaign_domains FORCE ROW LEVEL SECURITY;


--
-- Name: campaign_email_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.campaign_email_templates (
    id text NOT NULL,
    "campaignId" text NOT NULL,
    subject text NOT NULL,
    "previewText" text,
    content text NOT NULL,
    "postmarkTemplateId" text,
    metadata jsonb,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: campaign_exclusion_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.campaign_exclusion_events (
    id text NOT NULL,
    "campaignId" text NOT NULL,
    "contactId" text,
    "customerId" text NOT NULL,
    "eventType" text NOT NULL,
    "performedByMemberId" text NOT NULL,
    "occurredAt" timestamp without time zone NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT campaign_exclusion_events_event_type_check CHECK (("eventType" = ANY (ARRAY['sent'::text, 'delivered'::text, 'bounced'::text, 'opened'::text, 'clicked'::text, 'replied'::text, 'unsubscribed'::text, 'spam_complaint'::text, 'excluded'::text, 'included'::text])))
);


--
-- Name: campaign_recipient_emails; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.campaign_recipient_emails (
    id text NOT NULL,
    "campaignId" text NOT NULL,
    "contactId" text NOT NULL,
    "postmarkId" text,
    "emailSent" boolean DEFAULT false NOT NULL,
    "emailDelivered" boolean DEFAULT false NOT NULL,
    "emailBounced" boolean DEFAULT false NOT NULL,
    "emailOpened" boolean DEFAULT false NOT NULL,
    "emailClicked" boolean DEFAULT false NOT NULL,
    "emailSpamComplaint" boolean DEFAULT false NOT NULL,
    unsubscribed boolean DEFAULT false NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "emailSentAt" timestamp without time zone,
    "emailDeliveredAt" timestamp without time zone,
    "emailBouncedAt" timestamp without time zone,
    "emailOpenedAt" timestamp without time zone,
    "emailClickedAt" timestamp without time zone,
    "emailSpamComplaintAt" timestamp without time zone,
    "emailReplied" boolean DEFAULT false NOT NULL,
    "emailRepliedAt" timestamp without time zone,
    "unsubscribedAt" timestamp without time zone,
    "emailOpenedByBot" boolean DEFAULT false NOT NULL
);


--
-- Name: campaign_recipient_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.campaign_recipient_events (
    id text NOT NULL,
    "recipientEmailId" text NOT NULL,
    "eventType" text NOT NULL,
    "occurredAt" timestamp without time zone NOT NULL,
    metadata jsonb,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT campaign_recipient_events_event_type_check CHECK (("eventType" = ANY (ARRAY['sent'::text, 'delivered'::text, 'bounced'::text, 'opened'::text, 'clicked'::text, 'replied'::text, 'unsubscribed'::text, 'spam_complaint'::text, 'excluded'::text, 'included'::text])))
);


--
-- Name: campaigns; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.campaigns (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    objective text,
    icon text DEFAULT 'mail'::text,
    status text DEFAULT 'details'::text NOT NULL,
    "hasAllCustomers" boolean DEFAULT false NOT NULL,
    "workspaceId" text NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "imageUrl" text,
    CONSTRAINT campaign_status_check CHECK ((status = ANY (ARRAY['details'::text, 'recipients'::text, 'flowBuilder'::text, 'settings'::text, 'draftSend'::text, 'scheduled'::text, 'active'::text])))
);

ALTER TABLE ONLY public.campaigns FORCE ROW LEVEL SECURITY;


--
-- Name: contacts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contacts (
    id text NOT NULL,
    "workspaceId" text NOT NULL,
    "firstName" text,
    "lastName" text,
    company text,
    "jobTitle" text,
    email text,
    phone text,
    linkedin text,
    notes text,
    tags text,
    "externalId" text,
    data jsonb DEFAULT '{}'::jsonb,
    "createdBy" text,
    "updatedBy" text,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "addressId" text,
    "dateOfDeath" timestamp without time zone
);

ALTER TABLE ONLY public.contacts FORCE ROW LEVEL SECURITY;


--
-- Name: campaign_recipient_analytics_view; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.campaign_recipient_analytics_view AS
 SELECT ((c.id || '_'::text) || camp.id) AS id,
    camp.id AS "campaignId",
    c.id AS "contactId",
    camp."workspaceId",
    c."firstName",
    c."lastName",
    c.email,
    bool_or(cre."emailSent") AS "emailSent",
    min(cre."emailSentAt") AS "emailSentAt",
    bool_or(cre."emailDelivered") AS "emailDelivered",
    min(cre."emailDeliveredAt") AS "emailDeliveredAt",
    bool_or(cre."emailBounced") AS "emailBounced",
    min(cre."emailBouncedAt") AS "emailBouncedAt",
    bool_or(cre."emailOpened") AS "emailOpened",
    max(cre."emailOpenedAt") AS "emailOpenedAt",
    COALESCE(( SELECT (count(*))::integer AS count
           FROM (public.campaign_recipient_events crev
             JOIN public.campaign_recipient_emails cre_inner ON ((crev."recipientEmailId" = cre_inner.id)))
          WHERE ((cre_inner."contactId" = c.id) AND (cre_inner."campaignId" = camp.id) AND (crev."eventType" = 'opened'::text))), 0) AS "emailOpenedCount",
    bool_or(cre."emailClicked") AS "emailClicked",
    max(cre."emailClickedAt") AS "emailClickedAt",
    COALESCE(( SELECT (count(*))::integer AS count
           FROM (public.campaign_recipient_events crev
             JOIN public.campaign_recipient_emails cre_inner ON ((crev."recipientEmailId" = cre_inner.id)))
          WHERE ((cre_inner."contactId" = c.id) AND (cre_inner."campaignId" = camp.id) AND (crev."eventType" = 'clicked'::text))), 0) AS "emailClickedCount",
    bool_or(cre."emailSpamComplaint") AS "emailSpamComplaint",
    min(cre."emailSpamComplaintAt") AS "emailSpamComplaintAt",
    bool_or(cre."emailReplied") AS "emailReplied",
    max(cre."emailRepliedAt") AS "emailRepliedAt",
    COALESCE(( SELECT (count(*))::integer AS count
           FROM (public.campaign_recipient_events crev
             JOIN public.campaign_recipient_emails cre_inner ON ((crev."recipientEmailId" = cre_inner.id)))
          WHERE ((cre_inner."contactId" = c.id) AND (cre_inner."campaignId" = camp.id) AND (crev."eventType" = 'replied'::text))), 0) AS "emailRepliedCount",
    bool_or(cre.unsubscribed) AS unsubscribed,
    min(cre."unsubscribedAt") AS "unsubscribedAt",
    min(cre."createdAt") AS "createdAt",
    max(cre."updatedAt") AS "updatedAt"
   FROM ((public.campaign_recipient_emails cre
     JOIN public.contacts c ON ((c.id = cre."contactId")))
     JOIN public.campaigns camp ON ((camp.id = cre."campaignId")))
  WHERE ((current_setting('app.current_workspace_id'::text, true) IS NULL) OR (camp."workspaceId" = current_setting('app.current_workspace_id'::text, true)))
  GROUP BY c.id, camp.id, camp."workspaceId", c."firstName", c."lastName", c.email;


--
-- Name: campaign_recipients_contacts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.campaign_recipients_contacts (
    "campaignId" text NOT NULL,
    "contactId" text NOT NULL
);


--
-- Name: campaign_recipients_customers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.campaign_recipients_customers (
    "campaignId" text NOT NULL,
    "customerId" text NOT NULL
);


--
-- Name: campaign_recipients_lists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.campaign_recipients_lists (
    "campaignId" text NOT NULL,
    "listId" text NOT NULL
);


--
-- Name: campaign_recipients_smart_lists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.campaign_recipients_smart_lists (
    "campaignId" text NOT NULL,
    "smartListId" text NOT NULL
);


--
-- Name: campaign_sender_emails; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.campaign_sender_emails (
    id text NOT NULL,
    "workspaceId" text NOT NULL,
    email text NOT NULL,
    "postmarkSignatureId" text,
    status public.sender_email_status DEFAULT 'pending'::public.sender_email_status NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    signature text,
    "firstName" text DEFAULT 'Sender'::text NOT NULL,
    "lastName" text
);

ALTER TABLE ONLY public.campaign_sender_emails FORCE ROW LEVEL SECURITY;


--
-- Name: campaign_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.campaign_settings (
    id text NOT NULL,
    "campaignId" text NOT NULL,
    "senderEmail" text NOT NULL,
    "displayName" text NOT NULL,
    "replyTo" text,
    "automationSettings" text DEFAULT 'manual'::text NOT NULL,
    "excludePreviouslySent" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "ccMode" text DEFAULT 'none'::text NOT NULL,
    "ccAddresses" text,
    "senderMode" text DEFAULT 'static'::text NOT NULL,
    "bccMode" text DEFAULT 'none'::text NOT NULL,
    "bccAddresses" text,
    "scheduledSendAt" timestamp without time zone,
    "scheduledSendTimezone" text,
    "scheduledJobId" text,
    CONSTRAINT campaign_automation_settings_check CHECK (("automationSettings" = ANY (ARRAY['auto'::text, 'manual'::text]))),
    CONSTRAINT campaign_bcc_mode_check CHECK (("bccMode" = ANY (ARRAY['none'::text, 'sameForAll'::text, 'customerOwner'::text]))),
    CONSTRAINT campaign_cc_mode_check CHECK (("ccMode" = ANY (ARRAY['none'::text, 'sameForAll'::text, 'customerOwner'::text]))),
    CONSTRAINT campaign_sender_mode_check CHECK (("senderMode" = ANY (ARRAY['static'::text, 'dynamic'::text])))
);


--
-- Name: campaign_template_email_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.campaign_template_email_templates (
    id text NOT NULL,
    "campaignTemplateId" text NOT NULL,
    subject text NOT NULL,
    "previewText" text,
    content text NOT NULL,
    metadata jsonb,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: campaign_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.campaign_templates (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    objective text,
    icon text DEFAULT 'mail'::text,
    status text DEFAULT 'details'::text NOT NULL,
    "hasAllCustomers" boolean DEFAULT false NOT NULL,
    "workspaceId" text NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "imageUrl" text,
    CONSTRAINT campaign_templates_status_check CHECK ((status = ANY (ARRAY['details'::text, 'recipients'::text, 'flowBuilder'::text, 'settings'::text, 'draftSend'::text, 'scheduled'::text, 'active'::text])))
);

ALTER TABLE ONLY public.campaign_templates FORCE ROW LEVEL SECURITY;


--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    color text NOT NULL,
    icon text,
    path text NOT NULL,
    "parentId" text,
    "createdBy" text,
    "updatedBy" text,
    "workspaceId" text NOT NULL,
    metadata jsonb,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "externalId" text
);

ALTER TABLE ONLY public.categories FORCE ROW LEVEL SECURITY;


--
-- Name: categories_view; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.categories_view AS
 SELECT id,
    "workspaceId",
    "createdBy",
    "updatedBy",
    "createdAt",
    "updatedAt",
    name,
    description,
    "externalId",
    color,
    icon,
    "parentId",
    ((public.get_categories_tree(id) ->> 'subcategories'::text))::jsonb AS subcategories,
    to_tsvector('simple'::regconfig, ((COALESCE(name, ''::text) || ' '::text) || COALESCE(description, ''::text))) AS query
   FROM public.categories c
  WHERE (("parentId" IS NULL) AND ((current_setting('app.current_workspace_id'::text, true) IS NULL) OR ("workspaceId" = current_setting('app.current_workspace_id'::text, true))));


--
-- Name: cities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cities (
    id text NOT NULL,
    name text NOT NULL,
    "countryId" text NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: countries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.countries (
    id text NOT NULL,
    "isoCode" text NOT NULL,
    name text NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: customer_contacts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customer_contacts (
    "customerId" text NOT NULL,
    "contactId" text NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: postal_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.postal_codes (
    id text NOT NULL,
    code text NOT NULL,
    "countryId" text NOT NULL,
    "cityId" text,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: contacts_view; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.contacts_view AS
 SELECT c.id,
    c."workspaceId",
    c."createdBy",
    c."updatedBy",
    c."createdAt",
    c."updatedAt",
    c."firstName",
    c."lastName",
    c.email,
    c."externalId",
    c.company,
    c."jobTitle",
    c.phone,
    c.linkedin,
    c.notes,
    c.tags,
    c."dateOfDeath",
    addr.street AS "addressStreet",
    addr."houseNumber" AS "addressHouseNumber",
    addr."unitNumber" AS "addressUnitNumber",
    city.name AS "addressCity",
    pc.code AS "addressPostalCode",
    country.name AS "addressCountry",
    c.data,
    ( SELECT ARRAY( SELECT cc."customerId"
                   FROM public.customer_contacts cc
                  WHERE (cc."contactId" = c.id)) AS "array") AS customers,
        CASE
            WHEN ((c.email IS NULL) OR (c.email = ''::text) OR (c.company IS NULL) OR (c.company = ''::text) OR (c."jobTitle" IS NULL) OR (c."jobTitle" = ''::text)) THEN 1
            ELSE 0
        END AS "hasMissingInfo",
    to_tsvector('simple'::regconfig, ((((COALESCE(c."firstName", ''::text) || ' '::text) || COALESCE(c."lastName", ''::text)) || ' '::text) || COALESCE(c.email, ''::text))) AS query
   FROM ((((public.contacts c
     LEFT JOIN public.addresses addr ON ((addr.id = c."addressId")))
     LEFT JOIN public.countries country ON ((country.id = addr."countryId")))
     LEFT JOIN public.cities city ON ((city.id = addr."cityId")))
     LEFT JOIN public.postal_codes pc ON ((pc.id = addr."postalCodeId")))
  WHERE ((current_setting('app.current_workspace_id'::text, true) IS NULL) OR (c."workspaceId" = current_setting('app.current_workspace_id'::text, true)));


--
-- Name: coverages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.coverages (
    id text NOT NULL,
    "externalId" text NOT NULL,
    name text NOT NULL,
    description text,
    "workspaceId" text NOT NULL,
    "createdBy" text,
    "updatedBy" text,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.coverages FORCE ROW LEVEL SECURITY;


--
-- Name: customer_opportunities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customer_opportunities (
    "customerId" text NOT NULL,
    "opportunityId" text NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: customer_relationships; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customer_relationships (
    id text NOT NULL,
    "customerId" text NOT NULL,
    "relatedCustomerId" text NOT NULL,
    "relationshipType" text NOT NULL,
    "inverseType" text,
    "workspaceId" text NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT customer_relationships_inverse_type_check CHECK ((("inverseType" IS NULL) OR ("inverseType" = ANY (ARRAY['cohabiting_partner'::text, 'cohabitant'::text, 'spouse'::text, 'non_cohabiting_partner'::text, 'child'::text, 'stepchild'::text, 'stepparent'::text, 'son_daughter_in_law'::text, 'parent'::text, 'grandparent'::text, 'grandchild'::text, 'brother_sister'::text, 'half_brother_sister'::text, 'father_mother_in_law'::text, 'brother_sister_in_law'::text, 'uncle_aunt'::text, 'cousin_3rd_degree'::text, 'other_relative'::text, 'family'::text, 'member'::text, 'trade_professional_association'::text, 'employer'::text, 'employee'::text, 'accountant'::text, 'managing_director'::text, 'legal_representative'::text, 'interim_administrator'::text, 'property_manager'::text, 'ultimate_beneficial_owner'::text, 'company'::text, 'bank'::text, 'parent_company'::text, 'subsidiary'::text, 'sister_company'::text, 'foster_child'::text, 'foster_parent'::text])))),
    CONSTRAINT customer_relationships_relationship_type_check CHECK (("relationshipType" = ANY (ARRAY['cohabiting_partner'::text, 'cohabitant'::text, 'spouse'::text, 'non_cohabiting_partner'::text, 'child'::text, 'stepchild'::text, 'stepparent'::text, 'son_daughter_in_law'::text, 'parent'::text, 'grandparent'::text, 'grandchild'::text, 'brother_sister'::text, 'half_brother_sister'::text, 'father_mother_in_law'::text, 'brother_sister_in_law'::text, 'uncle_aunt'::text, 'cousin_3rd_degree'::text, 'other_relative'::text, 'family'::text, 'member'::text, 'trade_professional_association'::text, 'employer'::text, 'employee'::text, 'accountant'::text, 'managing_director'::text, 'legal_representative'::text, 'interim_administrator'::text, 'property_manager'::text, 'ultimate_beneficial_owner'::text, 'company'::text, 'bank'::text, 'parent_company'::text, 'subsidiary'::text, 'sister_company'::text, 'foster_child'::text, 'foster_parent'::text])))
);

ALTER TABLE ONLY public.customer_relationships FORCE ROW LEVEL SECURITY;


--
-- Name: customer_team; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customer_team (
    "customerId" text NOT NULL,
    "memberId" text NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: customers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customers (
    id text NOT NULL,
    name text,
    description text,
    "externalId" text,
    "ownerId" text,
    data jsonb,
    "createdBy" text,
    "updatedBy" text,
    "workspaceId" text NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "lastName" text,
    "customerType" text,
    "dateOfBirth" timestamp without time zone,
    "addressId" text,
    "firstName" text,
    "dateOfDeath" timestamp without time zone,
    "legalEntityType" text,
    CONSTRAINT customers_customer_type_check CHECK ((("customerType" IS NULL) OR ("customerType" = ANY (ARRAY['naturalPerson'::text, 'legalEntity'::text, 'group'::text]))))
);

ALTER TABLE ONLY public.customers FORCE ROW LEVEL SECURITY;


--
-- Name: members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.members (
    id text NOT NULL,
    "userId" text NOT NULL,
    "workspaceId" text NOT NULL,
    "keycloakId" text NOT NULL,
    "roleId" text NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    "joinedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.members FORCE ROW LEVEL SECURITY;


--
-- Name: opportunities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.opportunities (
    id text NOT NULL,
    "createdBy" text,
    "updatedBy" text,
    "workspaceId" text NOT NULL,
    name text NOT NULL,
    description text,
    "externalId" text,
    "policyId" text,
    amount jsonb,
    probability integer,
    stage text,
    "ownerId" text,
    "customerId" text,
    data jsonb DEFAULT '{}'::jsonb,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.opportunities FORCE ROW LEVEL SECURITY;


--
-- Name: partner_customers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.partner_customers (
    "partnerId" text NOT NULL,
    "customerId" text NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: partners; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.partners (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "externalId" text,
    "ownerId" text,
    data jsonb,
    "createdBy" text,
    "updatedBy" text,
    "workspaceId" text NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.partners FORCE ROW LEVEL SECURITY;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id text NOT NULL,
    email text NOT NULL,
    "firstName" text NOT NULL,
    "lastName" text,
    "profilePictureUrl" text,
    "profilePictureKey" text,
    title text,
    locale text DEFAULT 'en'::text NOT NULL,
    timezone text DEFAULT 'UTC'::text NOT NULL,
    "timeFormat" text DEFAULT 'Time24Hour'::text NOT NULL,
    "dateFormat" text DEFAULT 'MMDDYYYY'::text NOT NULL,
    disabled boolean DEFAULT false NOT NULL,
    "deletionRequestedAt" timestamp without time zone,
    "externalId" text,
    metadata jsonb,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT users_date_format_check CHECK (("dateFormat" = ANY (ARRAY['MMDDYYYY'::text, 'DDMMYYYY'::text, 'YYYYMMDD'::text]))),
    CONSTRAINT users_locale_check CHECK ((locale = ANY (ARRAY['en'::text, 'nl'::text, 'fr'::text]))),
    CONSTRAINT users_time_format_check CHECK (("timeFormat" = ANY (ARRAY['Time24Hour'::text, 'Time12Hour'::text])))
);


--
-- Name: customers_view; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.customers_view AS
 SELECT c.id,
    c."workspaceId",
    c."createdBy",
    c."updatedBy",
    c."createdAt",
    c."updatedAt",
    c.name,
    c."firstName",
    c."lastName",
    c."customerType",
    c."legalEntityType",
    c."dateOfBirth",
    c."dateOfDeath",
    c.description,
    c."externalId",
    addr.street AS "addressStreet",
    addr."houseNumber" AS "addressHouseNumber",
    addr."unitNumber" AS "addressUnitNumber",
    city.name AS "addressCity",
    pc.code AS "addressPostalCode",
    country.name AS "addressCountry",
    c."ownerId",
    c.data,
        CASE
            WHEN (u.id IS NULL) THEN NULL::jsonb
            ELSE jsonb_build_object('id', u.id, 'firstName', u."firstName", 'lastName', u."lastName", 'email', u.email, 'profilePictureUrl', u."profilePictureUrl")
        END AS "ownerData",
    COALESCE(( SELECT jsonb_agg(jsonb_build_object('id', u_1.id, 'firstName', u_1."firstName", 'lastName', u_1."lastName", 'email', u_1.email, 'profilePictureUrl', u_1."profilePictureUrl")) AS jsonb_agg
           FROM ((public.customer_team ct
             JOIN public.members m_1 ON ((m_1.id = ct."memberId")))
             JOIN public.users u_1 ON ((u_1.id = m_1."userId")))
          WHERE (ct."customerId" = c.id)), '[]'::jsonb) AS "teamData",
    ( SELECT count(*) AS count
           FROM public.customer_team ct
          WHERE (ct."customerId" = c.id)) AS "teamCount",
    ( SELECT ARRAY( SELECT ct."memberId"
                   FROM public.customer_team ct
                  WHERE (ct."customerId" = c.id)) AS "array") AS team,
    COALESCE(( SELECT jsonb_agg(jsonb_build_object('id', p.id, 'name', p.name)) AS jsonb_agg
           FROM (public.partner_customers pc_1
             JOIN public.partners p ON ((p.id = pc_1."partnerId")))
          WHERE (pc_1."customerId" = c.id)), '[]'::jsonb) AS "partnersData",
    ( SELECT count(*) AS count
           FROM public.partner_customers pc_1
          WHERE (pc_1."customerId" = c.id)) AS "partnersCount",
    ( SELECT ARRAY( SELECT pc_1."partnerId"
                   FROM public.partner_customers pc_1
                  WHERE (pc_1."customerId" = c.id)) AS "array") AS partners,
    COALESCE(( SELECT jsonb_agg(jsonb_build_object('id', o.id, 'name', o.name, 'value', ((o.amount ->> 'amount'::text))::integer, 'stage', o.stage)) AS jsonb_agg
           FROM (public.customer_opportunities co
             JOIN public.opportunities o ON ((o.id = co."opportunityId")))
          WHERE (co."customerId" = c.id)), '[]'::jsonb) AS "opportunitiesData",
    ( SELECT ARRAY( SELECT co."opportunityId"
                   FROM public.customer_opportunities co
                  WHERE (co."customerId" = c.id)) AS "array") AS opportunities,
    ( SELECT ARRAY( SELECT cc."contactId"
                   FROM public.customer_contacts cc
                  WHERE (cc."customerId" = c.id)) AS "array") AS contacts,
    COALESCE(( SELECT jsonb_agg(jsonb_build_object('id', ct.id, 'firstName', ct."firstName", 'lastName', ct."lastName", 'email', ct.email)) AS jsonb_agg
           FROM (public.customer_contacts cc
             JOIN public.contacts ct ON ((ct.id = cc."contactId")))
          WHERE (cc."customerId" = c.id)), '[]'::jsonb) AS "contactsData",
    COALESCE(( SELECT sum(((o.amount ->> 'amount'::text))::integer) AS sum
           FROM (public.customer_opportunities co
             JOIN public.opportunities o ON ((o.id = co."opportunityId")))
          WHERE ((co."customerId" = c.id) AND (o.amount IS NOT NULL))), (0)::bigint) AS "opportunitiesTotalValue",
    COALESCE(( SELECT (sum(round(((((o.amount ->> 'amount'::text))::integer)::numeric * ((COALESCE(o.probability, 0))::numeric / 100.0)))))::integer AS sum
           FROM (public.customer_opportunities co
             JOIN public.opportunities o ON ((o.id = co."opportunityId")))
          WHERE ((co."customerId" = c.id) AND (o.amount IS NOT NULL))), 0) AS "opportunitiesWeightedValue",
    to_tsvector('simple'::regconfig, ((((((COALESCE(c.name, ''::text) || ' '::text) || COALESCE(c."firstName", ''::text)) || ' '::text) || COALESCE(c.description, ''::text)) || ' '::text) || COALESCE(c."externalId", ''::text))) AS query
   FROM ((((((public.customers c
     LEFT JOIN public.addresses addr ON ((addr.id = c."addressId")))
     LEFT JOIN public.countries country ON ((country.id = addr."countryId")))
     LEFT JOIN public.cities city ON ((city.id = addr."cityId")))
     LEFT JOIN public.postal_codes pc ON ((pc.id = addr."postalCodeId")))
     LEFT JOIN public.members m ON ((m.id = c."ownerId")))
     LEFT JOIN public.users u ON ((u.id = m."userId")))
  WHERE ((current_setting('app.current_workspace_id'::text, true) IS NULL) OR (c."workspaceId" = current_setting('app.current_workspace_id'::text, true)));


--
-- Name: data_import_template_attributes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.data_import_template_attributes (
    "templateId" text NOT NULL,
    code text NOT NULL,
    "csvColumn" text NOT NULL,
    "entityType" text NOT NULL,
    "isExternalId" text,
    "externalIdAlsoIncludes" json DEFAULT '[]'::json,
    "nameCombineWith" json DEFAULT '[]'::json,
    "nameCombineSeparator" text,
    "isManuallyAdded" text
);


--
-- Name: data_import_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.data_import_templates (
    id text NOT NULL,
    name text NOT NULL,
    "entityType" text NOT NULL,
    "externalIdCsvColumns" json DEFAULT '[]'::json NOT NULL,
    "workspaceId" text NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "primaryEntityType" text
);

ALTER TABLE ONLY public.data_import_templates FORCE ROW LEVEL SECURITY;


--
-- Name: entity_list_configurations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.entity_list_configurations (
    id text NOT NULL,
    "memberId" text NOT NULL,
    "workspaceId" text NOT NULL,
    "entityType" text NOT NULL,
    "entityId" text,
    "listId" text,
    config jsonb NOT NULL,
    metadata jsonb,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "productConfig" jsonb,
    CONSTRAINT entity_list_configurations_entity_type_check CHECK (("entityType" = ANY (ARRAY['partner'::text, 'opportunity'::text, 'customer'::text, 'contact'::text, 'category'::text, 'user'::text, 'vendors'::text, 'product_template'::text, 'product'::text, 'workspace'::text, 'risk_object'::text, 'coverage'::text, 'lead'::text])))
);

ALTER TABLE ONLY public.entity_list_configurations FORCE ROW LEVEL SECURITY;


--
-- Name: entity_list_customers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.entity_list_customers (
    "entityListId" text NOT NULL,
    "entityId" text NOT NULL
);


--
-- Name: entity_list_leads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.entity_list_leads (
    "entityListId" text NOT NULL,
    "entityId" text NOT NULL
);


--
-- Name: entity_list_opportunities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.entity_list_opportunities (
    "entityListId" text NOT NULL,
    "entityId" text NOT NULL
);


--
-- Name: entity_list_partners; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.entity_list_partners (
    "entityListId" text NOT NULL,
    "entityId" text NOT NULL
);


--
-- Name: entity_list_product_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.entity_list_product_templates (
    "entityListId" text NOT NULL,
    "entityId" text NOT NULL
);


--
-- Name: entity_list_products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.entity_list_products (
    "entityListId" text NOT NULL,
    "entityId" text NOT NULL
);


--
-- Name: entity_lists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.entity_lists (
    id text NOT NULL,
    "userId" text NOT NULL,
    name text NOT NULL,
    description text,
    "entityType" text NOT NULL,
    "listType" text DEFAULT 'static'::text NOT NULL,
    filters jsonb,
    "workspaceId" text NOT NULL,
    metadata jsonb,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT entity_lists_entity_type_check CHECK (("entityType" = ANY (ARRAY['partner'::text, 'opportunity'::text, 'customer'::text, 'contact'::text, 'category'::text, 'user'::text, 'vendors'::text, 'product_template'::text, 'product'::text, 'workspace'::text, 'risk_object'::text, 'coverage'::text, 'lead'::text]))),
    CONSTRAINT entity_lists_list_type_check CHECK (("listType" = ANY (ARRAY['static'::text, 'dynamic'::text])))
);

ALTER TABLE ONLY public.entity_lists FORCE ROW LEVEL SECURITY;


--
-- Name: entity_views; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.entity_views (
    id text NOT NULL,
    name text NOT NULL,
    "entityType" text NOT NULL,
    filters text NOT NULL,
    "entityId" text,
    "userId" text NOT NULL,
    "workspaceId" text NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.entity_views FORCE ROW LEVEL SECURITY;


--
-- Name: global_campaign_template_email_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.global_campaign_template_email_templates (
    id text NOT NULL,
    "globalCampaignTemplateId" text NOT NULL,
    subject text NOT NULL,
    "previewText" text,
    content text NOT NULL,
    metadata jsonb,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: global_campaign_template_workspaces; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.global_campaign_template_workspaces (
    id text NOT NULL,
    "globalCampaignTemplateId" text NOT NULL,
    "workspaceId" text NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: global_campaign_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.global_campaign_templates (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    objective text,
    icon text DEFAULT 'mail'::text,
    "imageUrl" text,
    creator text NOT NULL,
    status text DEFAULT 'details'::text NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "includeBrokerLogo" boolean DEFAULT false NOT NULL,
    "includeInsurerLogo" boolean DEFAULT false NOT NULL,
    CONSTRAINT global_campaign_templates_creator_check CHECK ((creator = ANY (ARRAY['qollabi'::text, 'dela'::text, 'allianz'::text, 'axa'::text, 'baloise'::text]))),
    CONSTRAINT global_campaign_templates_status_check CHECK ((status = ANY (ARRAY['details'::text, 'recipients'::text, 'flowBuilder'::text, 'settings'::text, 'draftSend'::text, 'scheduled'::text, 'active'::text])))
);


--
-- Name: global_smart_list_template_workspaces; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.global_smart_list_template_workspaces (
    id text NOT NULL,
    "globalSmartListTemplateId" text NOT NULL,
    "workspaceId" text NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: global_smart_list_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.global_smart_list_templates (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    objective text,
    "entityType" text NOT NULL,
    status boolean DEFAULT true NOT NULL,
    query text NOT NULL,
    icon text,
    "iconKey" text,
    category text NOT NULL,
    "expirationDate" timestamp without time zone,
    rating numeric(2,1),
    message text,
    creator text,
    metadata jsonb,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT global_smart_list_templates_category_check CHECK ((category = ANY (ARRAY['qollabi'::text, 'offered'::text, 'marketRadar'::text]))),
    CONSTRAINT global_smart_list_templates_creator_check CHECK ((creator = ANY (ARRAY['qollabi'::text, 'dela'::text]))),
    CONSTRAINT global_smart_list_templates_entity_type_check CHECK (("entityType" = ANY (ARRAY['partner'::text, 'opportunity'::text, 'customer'::text, 'contact'::text, 'category'::text, 'user'::text, 'vendors'::text, 'product_template'::text, 'product'::text, 'workspace'::text, 'risk_object'::text, 'coverage'::text, 'lead'::text]))),
    CONSTRAINT global_smart_list_templates_rating_check CHECK (((rating >= (0)::numeric) AND (rating <= (5)::numeric)))
);


--
-- Name: invites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invites (
    id text NOT NULL,
    email text NOT NULL,
    "firstName" text NOT NULL,
    "lastName" text,
    "roleId" text NOT NULL,
    "workspaceId" text NOT NULL,
    token text NOT NULL,
    "invitedBy" text NOT NULL,
    "invitedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "acceptedAt" timestamp without time zone,
    "expiresAt" timestamp without time zone NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.invites FORCE ROW LEVEL SECURITY;


--
-- Name: key_metric_instances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.key_metric_instances (
    id text NOT NULL,
    "keyMetricTemplateId" text NOT NULL,
    "partnerId" text NOT NULL,
    name text NOT NULL,
    description text,
    type text NOT NULL,
    "hierarchyLevel" integer DEFAULT 0 NOT NULL,
    "parentId" text,
    "measurementUnit" text NOT NULL,
    target numeric(10,3),
    "progressBehavior" text NOT NULL,
    "hasProgressBar" boolean DEFAULT true NOT NULL,
    "progressBarBehavior" text DEFAULT 'simple'::text,
    "timeframeType" text NOT NULL,
    "startAt" date NOT NULL,
    "endAt" date NOT NULL,
    "milestoneFrequency" text DEFAULT 'none'::text NOT NULL,
    "milestoneCount" integer,
    "hasTrafficLight" boolean DEFAULT false NOT NULL,
    "trafficLightBehavior" text DEFAULT 'automatic'::text,
    "trafficLightThresholds" jsonb,
    "tagId" text,
    "createdBy" text,
    "updatedBy" text,
    "workspaceId" text NOT NULL,
    metadata jsonb,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    deleted boolean DEFAULT false,
    CONSTRAINT key_metric_instances_measurement_unit_check CHECK (("measurementUnit" = ANY (ARRAY['percentage'::text, 'currency'::text, 'number'::text]))),
    CONSTRAINT key_metric_instances_milestone_frequency_check CHECK (("milestoneFrequency" = ANY (ARRAY['yearly'::text, 'none'::text]))),
    CONSTRAINT key_metric_instances_progress_bar_behavior_check CHECK (("progressBarBehavior" = ANY (ARRAY['simple'::text, 'colorCoded'::text]))),
    CONSTRAINT key_metric_instances_progress_behavior_check CHECK (("progressBehavior" = ANY (ARRAY['exceed'::text, 'matchOrExceed'::text, 'match'::text, 'matchOrStayBelow'::text, 'stayBelow'::text]))),
    CONSTRAINT key_metric_instances_timeframe_type_check CHECK (("timeframeType" = ANY (ARRAY['indefinite'::text, 'fixedPeriod'::text]))),
    CONSTRAINT key_metric_instances_traffic_light_behavior_check CHECK (("trafficLightBehavior" = ANY (ARRAY['automatic'::text, 'custom'::text, 'manualSelection'::text]))),
    CONSTRAINT key_metric_instances_type_check CHECK ((type = ANY (ARRAY['keyMetric'::text, 'initiative'::text, 'submetric'::text])))
);

ALTER TABLE ONLY public.key_metric_instances FORCE ROW LEVEL SECURITY;


--
-- Name: key_metric_milestones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.key_metric_milestones (
    id text NOT NULL,
    "keyMetricInstanceId" text NOT NULL,
    "startAt" date NOT NULL,
    "endAt" date NOT NULL,
    target numeric(10,3),
    realized numeric(10,3),
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: key_metric_realized_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.key_metric_realized_history (
    id text NOT NULL,
    "keyMetricInstanceId" text NOT NULL,
    "milestoneId" text NOT NULL,
    "userId" text,
    target numeric(10,3) NOT NULL,
    realized numeric(10,3) DEFAULT '0'::numeric NOT NULL,
    "updatedAt" date NOT NULL,
    "createdAt" date DEFAULT now() NOT NULL
);


--
-- Name: key_metric_tag_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.key_metric_tag_categories (
    id text NOT NULL,
    name text NOT NULL,
    "createdBy" text,
    "updatedBy" text,
    "workspaceId" text NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.key_metric_tag_categories FORCE ROW LEVEL SECURITY;


--
-- Name: key_metric_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.key_metric_tags (
    id text NOT NULL,
    name text NOT NULL,
    color text DEFAULT '#3B82F6'::text NOT NULL,
    "categoryId" text,
    "createdBy" text,
    "updatedBy" text,
    "workspaceId" text NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.key_metric_tags FORCE ROW LEVEL SECURITY;


--
-- Name: key_metric_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.key_metric_templates (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    type text NOT NULL,
    "hierarchyLevel" integer DEFAULT 0 NOT NULL,
    "parentId" text,
    "measurementUnit" text NOT NULL,
    target numeric(10,3),
    "progressBehavior" text NOT NULL,
    "hasProgressBar" boolean DEFAULT true NOT NULL,
    "progressBarBehavior" text DEFAULT 'simple'::text,
    "timeframeType" text NOT NULL,
    "startAt" date NOT NULL,
    "endAt" date NOT NULL,
    "milestoneFrequency" text DEFAULT 'none'::text NOT NULL,
    "milestoneCount" integer,
    "hasTrafficLight" boolean DEFAULT false NOT NULL,
    "trafficLightBehavior" text DEFAULT 'automatic'::text,
    "trafficLightThresholds" jsonb,
    "tagId" text,
    "createdBy" text,
    "updatedBy" text,
    "workspaceId" text NOT NULL,
    metadata jsonb,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT key_metric_templates_measurement_unit_check CHECK (("measurementUnit" = ANY (ARRAY['percentage'::text, 'currency'::text, 'number'::text]))),
    CONSTRAINT key_metric_templates_milestone_frequency_check CHECK (("milestoneFrequency" = ANY (ARRAY['yearly'::text, 'none'::text]))),
    CONSTRAINT key_metric_templates_progress_bar_behavior_check CHECK (("progressBarBehavior" = ANY (ARRAY['simple'::text, 'colorCoded'::text]))),
    CONSTRAINT key_metric_templates_progress_behavior_check CHECK (("progressBehavior" = ANY (ARRAY['exceed'::text, 'matchOrExceed'::text, 'match'::text, 'matchOrStayBelow'::text, 'stayBelow'::text]))),
    CONSTRAINT key_metric_templates_timeframe_type_check CHECK (("timeframeType" = ANY (ARRAY['indefinite'::text, 'fixedPeriod'::text]))),
    CONSTRAINT key_metric_templates_traffic_light_behavior_check CHECK (("trafficLightBehavior" = ANY (ARRAY['automatic'::text, 'custom'::text, 'manualSelection'::text]))),
    CONSTRAINT key_metric_templates_type_check CHECK ((type = ANY (ARRAY['keyMetric'::text, 'initiative'::text, 'submetric'::text])))
);

ALTER TABLE ONLY public.key_metric_templates FORCE ROW LEVEL SECURITY;


--
-- Name: leads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leads (
    id text NOT NULL,
    "externalId" text,
    "firstName" text,
    "lastName" text,
    email text,
    company text,
    "attachmentLink" text,
    source text,
    "ownerId" text,
    "createdBy" text,
    "updatedBy" text,
    "workspaceId" text NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: leads_view; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.leads_view AS
 SELECT l.id,
    l."workspaceId",
    l."createdBy",
    l."updatedBy",
    l."createdAt",
    l."updatedAt",
    l."externalId",
    l."firstName",
    l."lastName",
    l.email,
    l.company,
    l."attachmentLink",
    l.source,
    l."ownerId",
        CASE
            WHEN (u.id IS NULL) THEN NULL::jsonb
            ELSE jsonb_build_object('id', u.id, 'firstName', u."firstName", 'lastName', u."lastName", 'email', u.email, 'profilePictureUrl', u."profilePictureUrl")
        END AS "ownerData",
    to_tsvector('simple'::regconfig, ((((((((COALESCE(l."firstName", ''::text) || ' '::text) || COALESCE(l."lastName", ''::text)) || ' '::text) || COALESCE(l.email, ''::text)) || ' '::text) || COALESCE(l.company, ''::text)) || ' '::text) || COALESCE(l."externalId", ''::text))) AS query
   FROM ((public.leads l
     LEFT JOIN public.members m ON ((m.id = l."ownerId")))
     LEFT JOIN public.users u ON ((u.id = m."userId")))
  WHERE ((current_setting('app.current_workspace_id'::text, true) IS NULL) OR (l."workspaceId" = current_setting('app.current_workspace_id'::text, true)));


--
-- Name: opportunities_team; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.opportunities_team (
    "opportunityId" text NOT NULL,
    "memberId" text NOT NULL
);


--
-- Name: opportunity_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.opportunity_comments (
    id text NOT NULL,
    "opportunityId" text NOT NULL,
    "memberId" text,
    "spaceUserId" text,
    content text NOT NULL,
    "workspaceId" text NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.opportunity_comments FORCE ROW LEVEL SECURITY;


--
-- Name: partner_opportunities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.partner_opportunities (
    "partnerId" text NOT NULL,
    "opportunityId" text NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "externalId" text,
    "productTemplateId" text,
    "contractStartDate" timestamp without time zone,
    "contractEndDate" timestamp without time zone,
    "totalValue" jsonb,
    "premiumValue" jsonb,
    "premiumPercentage" integer,
    "discountPercentage" integer,
    "productCategoryId" text,
    "opportunityId" text,
    "lifecycleStage" text DEFAULT 'opportunity'::text,
    "customerId" text,
    "insurerId" text,
    "policyNumber" integer,
    "contractId" text,
    "billingFrequencyId" text,
    "contractStatusId" text,
    "situationId" text,
    "lastPremium" jsonb,
    data jsonb DEFAULT '{}'::jsonb,
    "createdBy" text,
    "updatedBy" text,
    "workspaceId" text NOT NULL,
    metadata jsonb,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT products_lifecycle_stage_check CHECK (("lifecycleStage" = ANY (ARRAY['bought'::text, 'opportunity'::text, 'archived'::text])))
);

ALTER TABLE ONLY public.products FORCE ROW LEVEL SECURITY;


--
-- Name: opportunities_view; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.opportunities_view AS
 SELECT id,
    "workspaceId",
    "createdBy",
    "updatedBy",
    "createdAt",
    "updatedAt",
    "externalId" AS "opportunityId",
    "policyId",
    name,
    description,
    "externalId",
    amount,
    probability,
    stage,
    "ownerId",
    "customerId" AS customer,
    data,
    ( SELECT jsonb_build_object('id', u.id, 'firstName', u."firstName", 'lastName', u."lastName", 'email', u.email, 'profilePictureUrl', u."profilePictureUrl") AS jsonb_build_object
           FROM (public.members m
             JOIN public.users u ON ((u.id = m."userId")))
          WHERE ((m.id = o."ownerId") AND (m."workspaceId" = o."workspaceId"))) AS "ownerData",
    ( SELECT ( SELECT jsonb_build_object('id', jsonb_extract_path_text((option_json.option_json)::jsonb, VARIADIC ARRAY['id'::text]), 'name', jsonb_extract_path_text((option_json.option_json)::jsonb, VARIADIC ARRAY['name'::text]), 'color', jsonb_extract_path_text((option_json.option_json)::jsonb, VARIADIC ARRAY['color'::text])) AS jsonb_build_object
                   FROM unnest(a.options) option_json(option_json)
                  WHERE (jsonb_extract_path_text((option_json.option_json)::jsonb, VARIADIC ARRAY['id'::text]) = o.stage)
                 LIMIT 1) AS jsonb_build_object
           FROM public.attributes a
          WHERE ((a.code = 'stage'::text) AND (a."entityType" = 'opportunity'::text) AND (a."workspaceId" = o."workspaceId"))) AS "stageData",
    ( SELECT jsonb_agg(jsonb_build_object('id', u.id, 'firstName', u."firstName", 'lastName', u."lastName", 'email', u.email, 'profilePictureUrl', u."profilePictureUrl")) AS jsonb_agg
           FROM ( SELECT u_1.id,
                    u_1.email,
                    u_1."firstName",
                    u_1."lastName",
                    u_1."profilePictureUrl",
                    u_1."profilePictureKey",
                    u_1.title,
                    u_1.locale,
                    u_1.timezone,
                    u_1."timeFormat",
                    u_1."dateFormat",
                    u_1.disabled,
                    u_1."deletionRequestedAt",
                    u_1."externalId",
                    u_1.metadata,
                    u_1."createdAt",
                    u_1."updatedAt"
                   FROM ((public.opportunities_team ot
                     JOIN public.members m ON ((m.id = ot."memberId")))
                     JOIN public.users u_1 ON ((u_1.id = m."userId")))
                  WHERE (ot."opportunityId" = o.id)
                 LIMIT 2) u) AS "teamData",
    ( SELECT count(*) AS count
           FROM public.opportunities_team ot
          WHERE (ot."opportunityId" = o.id)) AS "teamCount",
    ( SELECT ARRAY( SELECT ot."memberId"
                   FROM public.opportunities_team ot
                  WHERE (ot."opportunityId" = o.id)) AS "array") AS team,
    ( SELECT jsonb_build_object('id', c.id, 'name', c.name) AS jsonb_build_object
           FROM public.customers c
          WHERE (c.id = o."customerId")) AS "customerData",
    ( SELECT ARRAY( SELECT po."partnerId"
                   FROM public.partner_opportunities po
                  WHERE (po."opportunityId" = o.id)) AS "array") AS partners,
    ( SELECT jsonb_agg(jsonb_build_object('id', p.id, 'name', p.name)) AS jsonb_agg
           FROM ( SELECT p_1.id,
                    p_1.name
                   FROM (public.partner_opportunities po
                     JOIN public.partners p_1 ON ((p_1.id = po."partnerId")))
                  WHERE (po."opportunityId" = o.id)
                 LIMIT 2) p) AS "partnersData",
    ( SELECT count(*) AS count
           FROM public.partner_opportunities po
          WHERE (po."opportunityId" = o.id)) AS "partnersCount",
    ( SELECT jsonb_agg(jsonb_build_object('id', p.id, 'name', p.name)) AS jsonb_agg
           FROM ( SELECT p_1.id,
                    p_1.name
                   FROM (public.partner_opportunities po
                     JOIN public.partners p_1 ON ((p_1.id = po."partnerId")))
                  WHERE (po."opportunityId" = o.id)) p) AS "partnerIds",
    ( SELECT count(*) AS count
           FROM (public.partner_opportunities po
             JOIN public.partners p ON ((p.id = po."partnerId")))
          WHERE (po."opportunityId" = o.id)) AS "partnerIdsCount",
    ( SELECT COALESCE(jsonb_agg(jsonb_build_object('id', p.id, 'name', p.name, 'externalId', p."externalId", 'description', p.description, 'productTemplateId', p."productTemplateId", 'insurerId', p."insurerId", 'productCategoryId', p."productCategoryId", 'totalValue', p."totalValue", 'premiumValue', p."premiumValue", 'premiumPercentage', COALESCE(p."premiumPercentage", 0), 'discountPercentage', COALESCE(p."discountPercentage", 0), 'lifecycleStage', COALESCE(p."lifecycleStage", 'opportunity'::text), 'customerId', p."customerId", 'data', p.data, 'workspaceId', p."workspaceId", 'createdAt', p."createdAt", 'updatedAt', p."updatedAt")), '[]'::jsonb) AS "coalesce"
           FROM public.products p
          WHERE (p."opportunityId" = o.id)) AS products,
    1 AS "opportunityCount",
    COALESCE(((amount ->> 'amount'::text))::integer, 0) AS "opportunityTotalValue",
    COALESCE((round(((((amount ->> 'amount'::text))::integer)::numeric * ((COALESCE(probability, 0))::numeric / 100.0))))::integer, 0) AS "opportunityWeightedValue",
    ( SELECT count(*) AS count
           FROM public.opportunity_comments c
          WHERE (c."opportunityId" = o.id)) AS "commentCount",
    to_tsvector('simple'::regconfig, COALESCE(name, ''::text)) AS query
   FROM public.opportunities o
  WHERE ((current_setting('app.current_workspace_id'::text, true) IS NULL) OR ("workspaceId" = current_setting('app.current_workspace_id'::text, true)));


--
-- Name: partner_team; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.partner_team (
    "partnerId" text NOT NULL,
    "memberId" text NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: partners_view; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.partners_view AS
 SELECT p.id,
    p."workspaceId",
    p."createdBy",
    p."updatedBy",
    p."createdAt",
    p."updatedAt",
    p.name,
    p.description,
    p."externalId",
    p."ownerId",
    p.data,
        CASE
            WHEN (u.id IS NULL) THEN NULL::jsonb
            ELSE jsonb_build_object('id', u.id, 'firstName', u."firstName", 'lastName', u."lastName", 'email', u.email, 'profilePictureUrl', u."profilePictureUrl")
        END AS "ownerData",
    COALESCE(( SELECT jsonb_agg(jsonb_build_object('id', u_1.id, 'firstName', u_1."firstName", 'lastName', u_1."lastName", 'email', u_1.email, 'profilePictureUrl', u_1."profilePictureUrl")) AS jsonb_agg
           FROM ((public.partner_team pt
             JOIN public.members m_1 ON ((m_1.id = pt."memberId")))
             JOIN public.users u_1 ON ((u_1.id = m_1."userId")))
          WHERE (pt."partnerId" = p.id)), '[]'::jsonb) AS "teamData",
    ( SELECT count(*) AS count
           FROM public.partner_team pt
          WHERE (pt."partnerId" = p.id)) AS "teamCount",
    ( SELECT ARRAY( SELECT pt."memberId"
                   FROM public.partner_team pt
                  WHERE (pt."partnerId" = p.id)) AS "array") AS team,
    COALESCE(( SELECT jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name)) AS jsonb_agg
           FROM (public.partner_customers pc
             JOIN public.customers c ON ((c.id = pc."customerId")))
          WHERE (pc."partnerId" = p.id)), '[]'::jsonb) AS "customersData",
    ( SELECT count(*) AS count
           FROM public.partner_customers pc
          WHERE (pc."partnerId" = p.id)) AS "customersCount",
    ( SELECT ARRAY( SELECT pc."customerId"
                   FROM public.partner_customers pc
                  WHERE (pc."partnerId" = p.id)) AS "array") AS customers,
    COALESCE(( SELECT jsonb_agg(jsonb_build_object('id', o.id, 'name', o.name, 'value', ((o.amount ->> 'amount'::text))::integer, 'stage', ( SELECT jsonb_extract_path_text((option_json.option_json)::jsonb, VARIADIC ARRAY['id'::text]) AS jsonb_extract_path_text
                   FROM unnest(a.options) option_json(option_json)
                  WHERE (jsonb_extract_path_text((option_json.option_json)::jsonb, VARIADIC ARRAY['id'::text]) = o.stage)
                 LIMIT 1))) AS jsonb_agg
           FROM ((public.partner_opportunities po
             JOIN public.opportunities o ON ((o.id = po."opportunityId")))
             LEFT JOIN public.attributes a ON ((a.code = 'stage'::text)))
          WHERE (po."partnerId" = p.id)), '[]'::jsonb) AS "opportunitiesData",
    ( SELECT ARRAY( SELECT po."opportunityId"
                   FROM public.partner_opportunities po
                  WHERE (po."partnerId" = p.id)) AS "array") AS opportunities,
    COALESCE(( SELECT sum(((o.amount ->> 'amount'::text))::integer) AS sum
           FROM (public.partner_opportunities po
             JOIN public.opportunities o ON ((o.id = po."opportunityId")))
          WHERE ((po."partnerId" = p.id) AND (o.amount IS NOT NULL))), (0)::bigint) AS "opportunitiesTotalValue",
    COALESCE(( SELECT (sum(round(((((o.amount ->> 'amount'::text))::integer)::numeric * ((o.probability)::numeric / 100.0)))))::integer AS sum
           FROM (public.partner_opportunities po
             JOIN public.opportunities o ON ((o.id = po."opportunityId")))
          WHERE ((po."partnerId" = p.id) AND (o.amount IS NOT NULL) AND (o.probability IS NOT NULL))), 0) AS "opportunitiesWeightedValue",
    to_tsvector('simple'::regconfig, ((((COALESCE(p.name, ''::text) || ' '::text) || COALESCE(p.description, ''::text)) || ' '::text) || COALESCE(p."externalId", ''::text))) AS query
   FROM ((public.partners p
     LEFT JOIN public.members m ON ((m.id = p."ownerId")))
     LEFT JOIN public.users u ON ((u.id = m."userId")))
  WHERE ((current_setting('app.current_workspace_id'::text, true) IS NULL) OR (p."workspaceId" = current_setting('app.current_workspace_id'::text, true)));


--
-- Name: product_partners; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_partners (
    "productId" text NOT NULL,
    "partnerId" text NOT NULL
);


--
-- Name: product_risk_objects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_risk_objects (
    "productId" text NOT NULL,
    "riskObjectId" text NOT NULL
);


--
-- Name: product_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_templates (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "externalId" text,
    "categoryId" text,
    "insurerId" text,
    "averagePrice" jsonb,
    "premiumPercentage" integer,
    "discountPercentage" integer,
    data jsonb,
    "createdBy" text,
    "updatedBy" text,
    "workspaceId" text NOT NULL,
    metadata jsonb,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.product_templates FORCE ROW LEVEL SECURITY;


--
-- Name: product_template_opportunities_view; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.product_template_opportunities_view AS
 SELECT DISTINCT "customerId",
    "productTemplateId",
    ( SELECT pt.name
           FROM public.product_templates pt
          WHERE (pt.id = p."productTemplateId")) AS "productTemplateName",
    "opportunityId",
    ( SELECT o.name
           FROM public.opportunities o
          WHERE (o.id = p."opportunityId")) AS "opportunityName",
    ( SELECT o.amount
           FROM public.opportunities o
          WHERE (o.id = p."opportunityId")) AS amount,
    ( SELECT o.probability
           FROM public.opportunities o
          WHERE (o.id = p."opportunityId")) AS probability,
    ( SELECT (option_data.option_data ->> 'name'::text)
           FROM public.attributes a,
            LATERAL unnest(a.options) option_data(option_data),
            public.opportunities o
          WHERE ((a.code = 'stage'::text) AND (o.id = p."opportunityId") AND ((option_data.option_data ->> 'id'::text) = o.stage))
         LIMIT 1) AS stage,
    ( SELECT string_agg(DISTINCT ( SELECT p_partner.name
                   FROM public.partners p_partner
                  WHERE (p_partner.id = pp_opp."partnerId")), ', '::text) AS string_agg
           FROM (public.products p_opp
             JOIN public.product_partners pp_opp ON ((pp_opp."productId" = p_opp.id)))
          WHERE ((p_opp."opportunityId" = p."opportunityId") AND (pp_opp."partnerId" IS NOT NULL) AND ((current_setting('app.current_workspace_id'::text, true) IS NULL) OR (p_opp."workspaceId" = current_setting('app.current_workspace_id'::text, true))))) AS partners
   FROM public.products p
  WHERE (("opportunityId" IS NOT NULL) AND ((current_setting('app.current_workspace_id'::text, true) IS NULL) OR ("workspaceId" = current_setting('app.current_workspace_id'::text, true))));


--
-- Name: product_template_partners_view; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.product_template_partners_view AS
 WITH partner_product_data AS (
         SELECT p."customerId",
            p."productTemplateId",
            pp."partnerId",
            p."lifecycleStage" AS stage
           FROM (public.products p
             JOIN public.product_partners pp ON ((pp."productId" = p.id)))
          WHERE ((pp."partnerId" IS NOT NULL) AND ((current_setting('app.current_workspace_id'::text, true) IS NULL) OR (p."workspaceId" = current_setting('app.current_workspace_id'::text, true))))
        ), partner_metrics AS (
         SELECT partner_product_data."customerId",
            partner_product_data."productTemplateId",
            partner_product_data."partnerId",
            count(
                CASE
                    WHEN (partner_product_data.stage = 'bought'::text) THEN 1
                    ELSE NULL::integer
                END) AS policies,
            count(
                CASE
                    WHEN (partner_product_data.stage = 'opportunity'::text) THEN 1
                    ELSE NULL::integer
                END) AS opportunities
           FROM partner_product_data
          GROUP BY partner_product_data."customerId", partner_product_data."productTemplateId", partner_product_data."partnerId"
        )
 SELECT "customerId",
    "productTemplateId",
    ( SELECT pt.name
           FROM public.product_templates pt
          WHERE (pt.id = pm."productTemplateId")) AS "productTemplateName",
    "partnerId",
    ( SELECT p.name
           FROM public.partners p
          WHERE (p.id = pm."partnerId")) AS "partnerName",
    COALESCE(policies, (0)::bigint) AS policies,
    COALESCE(opportunities, (0)::bigint) AS opportunities,
    0 AS campaigns
   FROM partner_metrics pm
  WHERE ("partnerId" IS NOT NULL);


--
-- Name: product_template_policies_view; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.product_template_policies_view AS
 SELECT "customerId",
    "productTemplateId",
    ( SELECT pt.name
           FROM public.product_templates pt
          WHERE (pt.id = p."productTemplateId")) AS "productTemplateName",
    COALESCE("externalId", id) AS "policyId",
    name AS policy,
    jsonb_build_object('date', ("contractStartDate")::text) AS "contractStartDate",
    jsonb_build_object('date', ("contractEndDate")::text) AS "contractEndDate",
    "totalValue",
    "premiumValue",
    "premiumPercentage" AS "premiumPercent",
    "discountPercentage" AS "discountPercent"
   FROM public.products p
  WHERE (("lifecycleStage" = 'bought'::text) AND ((current_setting('app.current_workspace_id'::text, true) IS NULL) OR ("workspaceId" = current_setting('app.current_workspace_id'::text, true))));


--
-- Name: product_templates_metrics_view; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.product_templates_metrics_view AS
 SELECT pt.id,
    pt."workspaceId",
    pt.name,
    pt.description,
    pt."categoryId" AS category,
    ( SELECT jsonb_build_object('id', c.id, 'name', c.name, 'icon', c.icon, 'color', c.color, 'path', c.path) AS jsonb_build_object
           FROM public.categories c
          WHERE (c.id = pt."categoryId")) AS "categoryData",
    all_customers.customer,
    COALESCE(customer_metrics."partnersCount", (0)::bigint) AS "partnersCount",
    COALESCE(customer_metrics."opportunitiesCount", (0)::bigint) AS "opportunitiesCount",
    COALESCE(customer_metrics."policiesCount", (0)::bigint) AS "policiesCount",
    customer_metrics."totalValue"
   FROM ((public.product_templates pt
     CROSS JOIN ( SELECT c.id AS customer
           FROM public.customers c
          WHERE ((current_setting('app.current_workspace_id'::text, true) IS NULL) OR (c."workspaceId" = current_setting('app.current_workspace_id'::text, true)))) all_customers)
     LEFT JOIN ( SELECT p."customerId" AS customer,
            p."productTemplateId" AS templateid,
            count(DISTINCT pp."partnerId") AS "partnersCount",
            count(DISTINCT p."opportunityId") AS "opportunitiesCount",
            count(
                CASE
                    WHEN (p."lifecycleStage" = 'bought'::text) THEN 1
                    ELSE NULL::integer
                END) AS "policiesCount",
                CASE
                    WHEN (count(p."totalValue") > 0) THEN jsonb_build_object('amount', COALESCE(sum(((p."totalValue" ->> 'amount'::text))::integer), (0)::bigint), 'currency', min((p."totalValue" ->> 'currency'::text)))
                    ELSE NULL::jsonb
                END AS "totalValue"
           FROM (public.products p
             LEFT JOIN public.product_partners pp ON ((pp."productId" = p.id)))
          WHERE ((current_setting('app.current_workspace_id'::text, true) IS NULL) OR (p."workspaceId" = current_setting('app.current_workspace_id'::text, true)))
          GROUP BY p."customerId", p."productTemplateId") customer_metrics ON (((customer_metrics.templateid = pt.id) AND (customer_metrics.customer = all_customers.customer))))
  WHERE ((current_setting('app.current_workspace_id'::text, true) IS NULL) OR (pt."workspaceId" = current_setting('app.current_workspace_id'::text, true)));


--
-- Name: product_templates_view; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.product_templates_view AS
 SELECT id,
    "workspaceId",
    "createdBy",
    "updatedBy",
    "createdAt",
    "updatedAt",
    metadata,
    name,
    "externalId",
    description,
    ( SELECT (option_data.option_data ->> 'name'::text)
           FROM public.attributes a,
            LATERAL unnest(a.options) option_data(option_data)
          WHERE ((a.code = 'insurer'::text) AND (a."entityType" = 'product_template'::text) AND (a."workspaceId" = pt."workspaceId") AND ((option_data.option_data ->> 'id'::text) = pt."insurerId"))
         LIMIT 1) AS insurer,
    "categoryId" AS category,
    ( SELECT jsonb_build_object('id', c.id, 'name', c.name, 'icon', c.icon, 'color', c.color, 'path', c.path) AS jsonb_build_object
           FROM public.categories c
          WHERE (c.id = pt."categoryId")) AS "categoryData",
    "averagePrice",
    COALESCE("premiumPercentage", 0) AS "premiumPercentage",
    COALESCE("discountPercentage", 0) AS "discountPercentage",
    to_tsvector('simple'::regconfig, ((((((COALESCE(name, ''::text) || ' '::text) || COALESCE(description, ''::text)) || ' '::text) || COALESCE(( SELECT c.name
           FROM public.categories c
          WHERE (c.id = pt."categoryId")), ''::text)) || ' '::text) || COALESCE(( SELECT (option_data.option_data ->> 'name'::text)
           FROM public.attributes a,
            LATERAL unnest(a.options) option_data(option_data)
          WHERE ((a.code = 'insurer'::text) AND (a."entityType" = 'product_template'::text) AND (a."workspaceId" = pt."workspaceId") AND ((option_data.option_data ->> 'id'::text) = pt."insurerId"))
         LIMIT 1), ''::text))) AS query
   FROM public.product_templates pt
  WHERE ((current_setting('app.current_workspace_id'::text, true) IS NULL) OR ("workspaceId" = current_setting('app.current_workspace_id'::text, true)));


--
-- Name: risk_object_coverages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.risk_object_coverages (
    "riskObjectId" text NOT NULL,
    "coverageId" text NOT NULL
);


--
-- Name: risk_objects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.risk_objects (
    id text NOT NULL,
    "externalId" text NOT NULL,
    name text NOT NULL,
    description text,
    "workspaceId" text NOT NULL,
    "createdBy" text,
    "updatedBy" text,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.risk_objects FORCE ROW LEVEL SECURITY;


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "workspaceId" text NOT NULL,
    internal boolean DEFAULT false NOT NULL,
    "grantedPermissions" text[] DEFAULT '{}'::text[] NOT NULL,
    metadata jsonb,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.roles FORCE ROW LEVEL SECURITY;


--
-- Name: shares; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shares (
    id text NOT NULL,
    "shareResourceId" text NOT NULL,
    "sharedWithId" text NOT NULL,
    "sharedById" text NOT NULL,
    "fromWorkspaceId" text NOT NULL,
    token text NOT NULL,
    status text DEFAULT 'shared'::text NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT shares_status_check CHECK ((status = ANY (ARRAY['shared'::text, 'visited'::text])))
);


--
-- Name: shares_resources; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shares_resources (
    id text NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    "resourceId" text NOT NULL,
    metadata jsonb,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT shares_resources_type_check CHECK ((type = ANY (ARRAY['opportunity'::text, 'opportunityList'::text])))
);


--
-- Name: workspaces; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workspaces (
    id text NOT NULL,
    name text NOT NULL,
    url text NOT NULL,
    currency text DEFAULT 'EUR'::text NOT NULL,
    disabled boolean DEFAULT false NOT NULL,
    "isGlobal" boolean DEFAULT false NOT NULL,
    "deletionRequestedAt" timestamp without time zone,
    metadata jsonb,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "postmarkServerToken" text,
    "postmarkInboundEmail" text,
    website text,
    "logoUrl" text,
    "logoKey" text,
    "postmarkServerId" text,
    type text DEFAULT 'broker'::text NOT NULL,
    clusters text[] DEFAULT '{}'::text[],
    groups text[] DEFAULT '{}'::text[],
    plan text DEFAULT 'freemium'::text NOT NULL,
    "brioEnabled" boolean DEFAULT false NOT NULL,
    "emailEnabled" boolean DEFAULT false NOT NULL,
    "profileData" jsonb DEFAULT '{}'::jsonb,
    language text DEFAULT 'en'::text NOT NULL,
    CONSTRAINT workspaces_currency_check CHECK ((currency = ANY (ARRAY['USD'::text, 'EUR'::text, 'GBP'::text, 'JPY'::text, 'AUD'::text, 'CAD'::text, 'CHF'::text, 'CNY'::text, 'CZK'::text, 'DKK'::text, 'INR'::text, 'IDR'::text, 'ZAR'::text, 'BRL'::text, 'LKR'::text, 'MYR'::text, 'MXN'::text, 'SGD'::text, 'NZD'::text, 'SEK'::text, 'NOK'::text, 'KRW'::text, 'RUB'::text, 'HKD'::text, 'SAR'::text, 'AED'::text, 'PLN'::text]))),
    CONSTRAINT workspaces_language_check CHECK ((language = ANY (ARRAY['en'::text, 'nl'::text, 'fr'::text]))),
    CONSTRAINT workspaces_plan_check CHECK ((plan = 'freemium'::text)),
    CONSTRAINT workspaces_type_check CHECK ((type = ANY (ARRAY['broker'::text, 'insuranceCompany'::text])))
);

ALTER TABLE ONLY public.workspaces FORCE ROW LEVEL SECURITY;


--
-- Name: shares_view; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.shares_view AS
 SELECT shares.id,
    shares."shareResourceId",
    shares."sharedWithId",
    shares."sharedById",
    shares."fromWorkspaceId",
    shares.token,
    shares.status,
    shares."createdAt",
    shares."updatedAt",
    jsonb_build_object('id', shares_resources.id, 'name', shares_resources.name, 'type', shares_resources.type, 'resourceId', shares_resources."resourceId", 'metadata', shares_resources.metadata) AS "shareResource",
    jsonb_build_object('id', anonymous_users.id, 'email', anonymous_users.email, 'userId', anonymous_users."userId") AS "sharedWith",
    jsonb_build_object('id', users.id, 'firstName', users."firstName", 'lastName', users."lastName", 'email', users.email) AS "sharedBy",
    jsonb_build_object('id', workspaces.id, 'name', workspaces.name, 'url', workspaces.url, 'currency', workspaces.currency) AS "fromWorkspace"
   FROM ((((public.shares
     JOIN public.shares_resources ON ((shares."shareResourceId" = shares_resources.id)))
     JOIN public.anonymous_users ON ((shares."sharedWithId" = anonymous_users.id)))
     JOIN public.users ON ((shares."sharedById" = users.id)))
     JOIN public.workspaces ON ((shares."fromWorkspaceId" = workspaces.id)));


--
-- Name: smart_list_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.smart_list_templates (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "entityType" text NOT NULL,
    status boolean DEFAULT true NOT NULL,
    query text NOT NULL,
    icon text,
    "iconKey" text,
    category text NOT NULL,
    "expirationDate" timestamp without time zone,
    rating numeric(2,1),
    message text,
    "workspaceId" text NOT NULL,
    metadata jsonb,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT smart_list_templates_category_check CHECK ((category = ANY (ARRAY['qollabi'::text, 'offered'::text, 'marketRadar'::text]))),
    CONSTRAINT smart_list_templates_entity_type_check CHECK (("entityType" = ANY (ARRAY['partner'::text, 'opportunity'::text, 'customer'::text, 'contact'::text, 'category'::text, 'user'::text, 'vendors'::text, 'product_template'::text, 'product'::text, 'workspace'::text, 'risk_object'::text, 'coverage'::text, 'lead'::text]))),
    CONSTRAINT smart_list_templates_rating_check CHECK (((rating >= (0)::numeric) AND (rating <= (5)::numeric)))
);

ALTER TABLE ONLY public.smart_list_templates FORCE ROW LEVEL SECURITY;


--
-- Name: smart_lists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.smart_lists (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "entityType" text NOT NULL,
    status boolean DEFAULT true NOT NULL,
    query text NOT NULL,
    "smartListTemplateId" text,
    "workspaceId" text NOT NULL,
    metadata jsonb,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "globalSmartListTemplateId" text,
    CONSTRAINT smart_lists_entity_type_check CHECK (("entityType" = ANY (ARRAY['partner'::text, 'opportunity'::text, 'customer'::text, 'contact'::text, 'category'::text, 'user'::text, 'vendors'::text, 'product_template'::text, 'product'::text, 'workspace'::text, 'risk_object'::text, 'coverage'::text, 'lead'::text])))
);

ALTER TABLE ONLY public.smart_lists FORCE ROW LEVEL SECURITY;


--
-- Name: tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tags (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "workspaceId" text NOT NULL,
    metadata jsonb,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.tags FORCE ROW LEVEL SECURITY;


--
-- Name: user_workspace_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_workspace_settings (
    id text NOT NULL,
    "userId" text NOT NULL,
    "workspaceId" text NOT NULL,
    locale text DEFAULT 'en'::text NOT NULL,
    "localeSetByUser" boolean DEFAULT false NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT user_workspace_settings_locale_check CHECK ((locale = ANY (ARRAY['en'::text, 'nl'::text, 'fr'::text])))
);


--
-- Name: workspace_entity_list_configurations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workspace_entity_list_configurations (
    id text NOT NULL,
    "workspaceId" text NOT NULL,
    "entityType" text NOT NULL,
    "configType" text DEFAULT 'main'::text NOT NULL,
    config jsonb NOT NULL,
    metadata jsonb,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT entity_list_configurations_config_type_check CHECK (("configType" = ANY (ARRAY['main'::text, 'detail'::text, 'list'::text]))),
    CONSTRAINT entity_list_configurations_entity_type_check CHECK (("entityType" = ANY (ARRAY['partner'::text, 'opportunity'::text, 'customer'::text, 'contact'::text, 'category'::text, 'user'::text, 'vendors'::text, 'product_template'::text, 'product'::text, 'workspace'::text, 'risk_object'::text, 'coverage'::text, 'lead'::text])))
);


--
-- Name: workspace_members_view; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.workspace_members_view AS
 SELECT workspaces.id,
    workspaces.name,
    workspaces.currency,
    workspaces.url,
    workspaces.website,
    workspaces."logoUrl",
    workspaces.disabled,
    workspaces."createdAt",
    workspaces."updatedAt",
    workspaces."deletionRequestedAt",
    members."userId",
    users."profilePictureUrl",
    jsonb_build_object('id', members."userId", 'keycloakId', members."keycloakId", 'roleId', members."roleId", 'joinedAt', members."joinedAt", 'enabled', members.enabled) AS membership,
    jsonb_build_object('id', users.id, 'firstName', users."firstName", 'lastName', users."lastName", 'email', users.email) AS "user"
   FROM ((public.workspaces
     JOIN public.members ON ((workspaces.id = members."workspaceId")))
     JOIN public.users ON ((members."userId" = users.id)));


--
-- Name: _private_job_queues; Type: TABLE; Schema: worker; Owner: -
--

CREATE TABLE worker._private_job_queues (
    id integer NOT NULL,
    queue_name text NOT NULL,
    locked_at timestamp with time zone,
    locked_by text,
    is_available boolean GENERATED ALWAYS AS ((locked_at IS NULL)) STORED NOT NULL,
    CONSTRAINT job_queues_queue_name_check CHECK ((length(queue_name) <= 128))
);


--
-- Name: _private_known_crontabs; Type: TABLE; Schema: worker; Owner: -
--

CREATE TABLE worker._private_known_crontabs (
    identifier text NOT NULL,
    known_since timestamp with time zone NOT NULL,
    last_execution timestamp with time zone
);


--
-- Name: _private_tasks; Type: TABLE; Schema: worker; Owner: -
--

CREATE TABLE worker._private_tasks (
    id integer NOT NULL,
    identifier text NOT NULL,
    CONSTRAINT tasks_identifier_check CHECK ((length(identifier) <= 128))
);


--
-- Name: job_queues_id_seq; Type: SEQUENCE; Schema: worker; Owner: -
--

ALTER TABLE worker._private_job_queues ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME worker.job_queues_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: jobs; Type: VIEW; Schema: worker; Owner: -
--

CREATE VIEW worker.jobs AS
 SELECT jobs.id,
    job_queues.queue_name,
    tasks.identifier AS task_identifier,
    jobs.priority,
    jobs.run_at,
    jobs.attempts,
    jobs.max_attempts,
    jobs.last_error,
    jobs.created_at,
    jobs.updated_at,
    jobs.key,
    jobs.locked_at,
    jobs.locked_by,
    jobs.revision,
    jobs.flags
   FROM ((worker._private_jobs jobs
     JOIN worker._private_tasks tasks ON ((tasks.id = jobs.task_id)))
     LEFT JOIN worker._private_job_queues job_queues ON ((job_queues.id = jobs.job_queue_id)));


--
-- Name: jobs_id_seq1; Type: SEQUENCE; Schema: worker; Owner: -
--

ALTER TABLE worker._private_jobs ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME worker.jobs_id_seq1
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: migrations; Type: TABLE; Schema: worker; Owner: -
--

CREATE TABLE worker.migrations (
    id integer NOT NULL,
    ts timestamp with time zone DEFAULT now() NOT NULL,
    breaking boolean DEFAULT false NOT NULL
);


--
-- Name: tasks_id_seq; Type: SEQUENCE; Schema: worker; Owner: -
--

ALTER TABLE worker._private_tasks ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME worker.tasks_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: __drizzle_migrations id; Type: DEFAULT; Schema: drizzle; Owner: -
--

ALTER TABLE ONLY drizzle.__drizzle_migrations ALTER COLUMN id SET DEFAULT nextval('drizzle.__drizzle_migrations_id_seq'::regclass);


--
-- Name: __drizzle_migrations __drizzle_migrations_pkey; Type: CONSTRAINT; Schema: drizzle; Owner: -
--

ALTER TABLE ONLY drizzle.__drizzle_migrations
    ADD CONSTRAINT __drizzle_migrations_pkey PRIMARY KEY (id);


--
-- Name: keyv keyv_pkey; Type: CONSTRAINT; Schema: kv; Owner: -
--

ALTER TABLE ONLY kv.keyv
    ADD CONSTRAINT keyv_pkey PRIMARY KEY (key);


--
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);


--
-- Name: addresses addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT addresses_pkey PRIMARY KEY (id);


--
-- Name: anonymous_users anonymous_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.anonymous_users
    ADD CONSTRAINT anonymous_users_pkey PRIMARY KEY (id);


--
-- Name: attributes attributes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attributes
    ADD CONSTRAINT attributes_pkey PRIMARY KEY (id);


--
-- Name: campaign_contact_exclusions campaign_contact_exclusions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_contact_exclusions
    ADD CONSTRAINT campaign_contact_exclusions_pkey PRIMARY KEY (id);


--
-- Name: campaign_custom_emails campaign_custom_emails_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_custom_emails
    ADD CONSTRAINT campaign_custom_emails_pkey PRIMARY KEY (id);


--
-- Name: campaign_domains campaign_domains_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_domains
    ADD CONSTRAINT campaign_domains_pkey PRIMARY KEY (id);


--
-- Name: campaign_email_templates campaign_email_templates_campaignId_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_email_templates
    ADD CONSTRAINT "campaign_email_templates_campaignId_unique" UNIQUE ("campaignId");


--
-- Name: campaign_email_templates campaign_email_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_email_templates
    ADD CONSTRAINT campaign_email_templates_pkey PRIMARY KEY (id);


--
-- Name: campaign_exclusion_events campaign_exclusion_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_exclusion_events
    ADD CONSTRAINT campaign_exclusion_events_pkey PRIMARY KEY (id);


--
-- Name: campaign_recipient_emails campaign_recipient_emails_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_recipient_emails
    ADD CONSTRAINT campaign_recipient_emails_pkey PRIMARY KEY (id);


--
-- Name: campaign_recipient_emails campaign_recipient_emails_postmarkId_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_recipient_emails
    ADD CONSTRAINT "campaign_recipient_emails_postmarkId_unique" UNIQUE ("postmarkId");


--
-- Name: campaign_recipient_events campaign_recipient_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_recipient_events
    ADD CONSTRAINT campaign_recipient_events_pkey PRIMARY KEY (id);


--
-- Name: campaign_recipients_contacts campaign_recipients_contacts_campaignId_contactId_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_recipients_contacts
    ADD CONSTRAINT "campaign_recipients_contacts_campaignId_contactId_pk" PRIMARY KEY ("campaignId", "contactId");


--
-- Name: campaign_recipients_customers campaign_recipients_customers_campaignId_customerId_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_recipients_customers
    ADD CONSTRAINT "campaign_recipients_customers_campaignId_customerId_pk" PRIMARY KEY ("campaignId", "customerId");


--
-- Name: campaign_recipients_lists campaign_recipients_lists_campaignId_listId_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_recipients_lists
    ADD CONSTRAINT "campaign_recipients_lists_campaignId_listId_pk" PRIMARY KEY ("campaignId", "listId");


--
-- Name: campaign_recipients_smart_lists campaign_recipients_smart_lists_campaignId_smartListId_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_recipients_smart_lists
    ADD CONSTRAINT "campaign_recipients_smart_lists_campaignId_smartListId_pk" PRIMARY KEY ("campaignId", "smartListId");


--
-- Name: campaign_sender_emails campaign_sender_emails_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_sender_emails
    ADD CONSTRAINT campaign_sender_emails_pkey PRIMARY KEY (id);


--
-- Name: campaign_settings campaign_settings_campaignId_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_settings
    ADD CONSTRAINT "campaign_settings_campaignId_unique" UNIQUE ("campaignId");


--
-- Name: campaign_settings campaign_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_settings
    ADD CONSTRAINT campaign_settings_pkey PRIMARY KEY (id);


--
-- Name: campaign_template_email_templates campaign_template_email_templates_campaignTemplateId_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_template_email_templates
    ADD CONSTRAINT "campaign_template_email_templates_campaignTemplateId_unique" UNIQUE ("campaignTemplateId");


--
-- Name: campaign_template_email_templates campaign_template_email_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_template_email_templates
    ADD CONSTRAINT campaign_template_email_templates_pkey PRIMARY KEY (id);


--
-- Name: campaign_templates campaign_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_templates
    ADD CONSTRAINT campaign_templates_pkey PRIMARY KEY (id);


--
-- Name: campaigns campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaigns
    ADD CONSTRAINT campaigns_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: cities cities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cities
    ADD CONSTRAINT cities_pkey PRIMARY KEY (id);


--
-- Name: contacts contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_pkey PRIMARY KEY (id);


--
-- Name: countries countries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.countries
    ADD CONSTRAINT countries_pkey PRIMARY KEY (id);


--
-- Name: coverages coverages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coverages
    ADD CONSTRAINT coverages_pkey PRIMARY KEY (id);


--
-- Name: customer_contacts customer_contacts_customerId_contactId_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_contacts
    ADD CONSTRAINT "customer_contacts_customerId_contactId_pk" PRIMARY KEY ("customerId", "contactId");


--
-- Name: customer_opportunities customer_opportunities_customerId_opportunityId_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_opportunities
    ADD CONSTRAINT "customer_opportunities_customerId_opportunityId_pk" PRIMARY KEY ("customerId", "opportunityId");


--
-- Name: customer_relationships customer_relationships_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_relationships
    ADD CONSTRAINT customer_relationships_pkey PRIMARY KEY (id);


--
-- Name: customer_team customer_team_customerId_memberId_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_team
    ADD CONSTRAINT "customer_team_customerId_memberId_pk" PRIMARY KEY ("customerId", "memberId");


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: data_import_template_attributes data_import_template_attributes_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.data_import_template_attributes
    ADD CONSTRAINT data_import_template_attributes_pk PRIMARY KEY ("templateId", code, "entityType");


--
-- Name: data_import_templates data_import_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.data_import_templates
    ADD CONSTRAINT data_import_templates_pkey PRIMARY KEY (id);


--
-- Name: entity_list_configurations entity_list_configurations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entity_list_configurations
    ADD CONSTRAINT entity_list_configurations_pkey PRIMARY KEY (id);


--
-- Name: entity_list_customers entity_list_customers_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entity_list_customers
    ADD CONSTRAINT entity_list_customers_pk PRIMARY KEY ("entityListId", "entityId");


--
-- Name: entity_list_leads entity_list_leads_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entity_list_leads
    ADD CONSTRAINT entity_list_leads_pk PRIMARY KEY ("entityListId", "entityId");


--
-- Name: entity_list_opportunities entity_list_opportunities_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entity_list_opportunities
    ADD CONSTRAINT entity_list_opportunities_pk PRIMARY KEY ("entityListId", "entityId");


--
-- Name: entity_list_partners entity_list_partners_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entity_list_partners
    ADD CONSTRAINT entity_list_partners_pk PRIMARY KEY ("entityListId", "entityId");


--
-- Name: entity_list_product_templates entity_list_product_templates_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entity_list_product_templates
    ADD CONSTRAINT entity_list_product_templates_pk PRIMARY KEY ("entityListId", "entityId");


--
-- Name: entity_list_products entity_list_products_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entity_list_products
    ADD CONSTRAINT entity_list_products_pk PRIMARY KEY ("entityListId", "entityId");


--
-- Name: entity_lists entity_lists_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entity_lists
    ADD CONSTRAINT entity_lists_pkey PRIMARY KEY (id);


--
-- Name: entity_views entity_views_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entity_views
    ADD CONSTRAINT entity_views_pkey PRIMARY KEY (id);


--
-- Name: global_campaign_template_email_templates global_campaign_template_email_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.global_campaign_template_email_templates
    ADD CONSTRAINT global_campaign_template_email_templates_pkey PRIMARY KEY (id);


--
-- Name: global_campaign_template_workspaces global_campaign_template_workspaces_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.global_campaign_template_workspaces
    ADD CONSTRAINT global_campaign_template_workspaces_pkey PRIMARY KEY (id);


--
-- Name: global_campaign_templates global_campaign_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.global_campaign_templates
    ADD CONSTRAINT global_campaign_templates_pkey PRIMARY KEY (id);


--
-- Name: global_campaign_template_email_templates global_ct_email_templates_template_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.global_campaign_template_email_templates
    ADD CONSTRAINT global_ct_email_templates_template_id_unique UNIQUE ("globalCampaignTemplateId");


--
-- Name: global_campaign_template_workspaces global_ct_workspaces_template_workspace_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.global_campaign_template_workspaces
    ADD CONSTRAINT global_ct_workspaces_template_workspace_unique UNIQUE ("globalCampaignTemplateId", "workspaceId");


--
-- Name: global_smart_list_template_workspaces global_slt_workspaces_template_workspace_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.global_smart_list_template_workspaces
    ADD CONSTRAINT global_slt_workspaces_template_workspace_unique UNIQUE ("globalSmartListTemplateId", "workspaceId");


--
-- Name: global_smart_list_template_workspaces global_smart_list_template_workspaces_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.global_smart_list_template_workspaces
    ADD CONSTRAINT global_smart_list_template_workspaces_pkey PRIMARY KEY (id);


--
-- Name: global_smart_list_templates global_smart_list_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.global_smart_list_templates
    ADD CONSTRAINT global_smart_list_templates_pkey PRIMARY KEY (id);


--
-- Name: invites invites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invites
    ADD CONSTRAINT invites_pkey PRIMARY KEY (id);


--
-- Name: key_metric_instances key_metric_instances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.key_metric_instances
    ADD CONSTRAINT key_metric_instances_pkey PRIMARY KEY (id);


--
-- Name: key_metric_milestones key_metric_milestones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.key_metric_milestones
    ADD CONSTRAINT key_metric_milestones_pkey PRIMARY KEY (id);


--
-- Name: key_metric_realized_history key_metric_realized_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.key_metric_realized_history
    ADD CONSTRAINT key_metric_realized_history_pkey PRIMARY KEY (id);


--
-- Name: key_metric_tag_categories key_metric_tag_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.key_metric_tag_categories
    ADD CONSTRAINT key_metric_tag_categories_pkey PRIMARY KEY (id);


--
-- Name: key_metric_tags key_metric_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.key_metric_tags
    ADD CONSTRAINT key_metric_tags_pkey PRIMARY KEY (id);


--
-- Name: key_metric_templates key_metric_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.key_metric_templates
    ADD CONSTRAINT key_metric_templates_pkey PRIMARY KEY (id);


--
-- Name: leads leads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_pkey PRIMARY KEY (id);


--
-- Name: members members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.members
    ADD CONSTRAINT members_pkey PRIMARY KEY (id);


--
-- Name: opportunities opportunities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunities
    ADD CONSTRAINT opportunities_pkey PRIMARY KEY (id);


--
-- Name: opportunities_team opportunities_team_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunities_team
    ADD CONSTRAINT opportunities_team_pk PRIMARY KEY ("opportunityId", "memberId");


--
-- Name: opportunity_comments opportunity_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunity_comments
    ADD CONSTRAINT opportunity_comments_pkey PRIMARY KEY (id);


--
-- Name: partner_customers partner_customers_partnerId_customerId_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_customers
    ADD CONSTRAINT "partner_customers_partnerId_customerId_pk" PRIMARY KEY ("partnerId", "customerId");


--
-- Name: partner_opportunities partner_opportunities_partnerId_opportunityId_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_opportunities
    ADD CONSTRAINT "partner_opportunities_partnerId_opportunityId_pk" PRIMARY KEY ("partnerId", "opportunityId");


--
-- Name: partner_team partner_team_partnerId_memberId_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_team
    ADD CONSTRAINT "partner_team_partnerId_memberId_pk" PRIMARY KEY ("partnerId", "memberId");


--
-- Name: partners partners_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partners
    ADD CONSTRAINT partners_pkey PRIMARY KEY (id);


--
-- Name: postal_codes postal_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.postal_codes
    ADD CONSTRAINT postal_codes_pkey PRIMARY KEY (id);


--
-- Name: product_partners product_partners_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_partners
    ADD CONSTRAINT product_partners_pk PRIMARY KEY ("productId", "partnerId");


--
-- Name: product_risk_objects product_risk_objects_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_risk_objects
    ADD CONSTRAINT product_risk_objects_pk PRIMARY KEY ("productId", "riskObjectId");


--
-- Name: product_templates product_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_templates
    ADD CONSTRAINT product_templates_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: risk_object_coverages risk_object_coverages_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.risk_object_coverages
    ADD CONSTRAINT risk_object_coverages_pk PRIMARY KEY ("riskObjectId", "coverageId");


--
-- Name: risk_objects risk_objects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.risk_objects
    ADD CONSTRAINT risk_objects_pkey PRIMARY KEY (id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: shares shares_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shares
    ADD CONSTRAINT shares_pkey PRIMARY KEY (id);


--
-- Name: shares_resources shares_resources_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shares_resources
    ADD CONSTRAINT shares_resources_pkey PRIMARY KEY (id);


--
-- Name: smart_list_templates smart_list_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.smart_list_templates
    ADD CONSTRAINT smart_list_templates_pkey PRIMARY KEY (id);


--
-- Name: smart_lists smart_lists_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.smart_lists
    ADD CONSTRAINT smart_lists_pkey PRIMARY KEY (id);


--
-- Name: tags tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY (id);


--
-- Name: user_workspace_settings user_workspace_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_workspace_settings
    ADD CONSTRAINT user_workspace_settings_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: workspace_entity_list_configurations workspace_entity_list_configurations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workspace_entity_list_configurations
    ADD CONSTRAINT workspace_entity_list_configurations_pkey PRIMARY KEY (id);


--
-- Name: workspaces workspaces_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workspaces
    ADD CONSTRAINT workspaces_pkey PRIMARY KEY (id);


--
-- Name: _private_job_queues job_queues_pkey1; Type: CONSTRAINT; Schema: worker; Owner: -
--

ALTER TABLE ONLY worker._private_job_queues
    ADD CONSTRAINT job_queues_pkey1 PRIMARY KEY (id);


--
-- Name: _private_job_queues job_queues_queue_name_key; Type: CONSTRAINT; Schema: worker; Owner: -
--

ALTER TABLE ONLY worker._private_job_queues
    ADD CONSTRAINT job_queues_queue_name_key UNIQUE (queue_name);


--
-- Name: _private_jobs jobs_key_key1; Type: CONSTRAINT; Schema: worker; Owner: -
--

ALTER TABLE ONLY worker._private_jobs
    ADD CONSTRAINT jobs_key_key1 UNIQUE (key);


--
-- Name: _private_jobs jobs_pkey1; Type: CONSTRAINT; Schema: worker; Owner: -
--

ALTER TABLE ONLY worker._private_jobs
    ADD CONSTRAINT jobs_pkey1 PRIMARY KEY (id);


--
-- Name: _private_known_crontabs known_crontabs_pkey; Type: CONSTRAINT; Schema: worker; Owner: -
--

ALTER TABLE ONLY worker._private_known_crontabs
    ADD CONSTRAINT known_crontabs_pkey PRIMARY KEY (identifier);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: worker; Owner: -
--

ALTER TABLE ONLY worker.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: _private_tasks tasks_identifier_key; Type: CONSTRAINT; Schema: worker; Owner: -
--

ALTER TABLE ONLY worker._private_tasks
    ADD CONSTRAINT tasks_identifier_key UNIQUE (identifier);


--
-- Name: _private_tasks tasks_pkey; Type: CONSTRAINT; Schema: worker; Owner: -
--

ALTER TABLE ONLY worker._private_tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: activity_logs_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX activity_logs_created_at_idx ON public.activity_logs USING btree ("createdAt");


--
-- Name: activity_logs_entity_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX activity_logs_entity_idx ON public.activity_logs USING btree ("entityType", "entityId");


--
-- Name: activity_logs_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX activity_logs_user_id_idx ON public.activity_logs USING btree ("userId");


--
-- Name: activity_logs_workspace_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX activity_logs_workspace_id_idx ON public.activity_logs USING btree ("workspaceId");


--
-- Name: address_city_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX address_city_id_idx ON public.addresses USING btree ("cityId");


--
-- Name: address_country_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX address_country_id_idx ON public.addresses USING btree ("countryId");


--
-- Name: address_location_composite_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX address_location_composite_idx ON public.addresses USING btree ("workspaceId", street, "houseNumber", "unitNumber", "countryId", "cityId", "postalCodeId");


--
-- Name: address_postal_code_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX address_postal_code_id_idx ON public.addresses USING btree ("postalCodeId");


--
-- Name: address_workspace_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX address_workspace_id_idx ON public.addresses USING btree ("workspaceId");


--
-- Name: anonymous_users_email_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX anonymous_users_email_idx ON public.anonymous_users USING btree (email);


--
-- Name: anonymous_users_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX anonymous_users_user_id_idx ON public.anonymous_users USING btree ("userId");


--
-- Name: attributes_name_entity_type_workspace_id_unique_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX attributes_name_entity_type_workspace_id_unique_idx ON public.attributes USING btree (name, "entityType", "workspaceId");


--
-- Name: attributes_workspace_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX attributes_workspace_id_idx ON public.attributes USING btree ("workspaceId");


--
-- Name: campaign_contact_exclusions_campaign_customer_contact_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX campaign_contact_exclusions_campaign_customer_contact_unique ON public.campaign_contact_exclusions USING btree ("campaignId", "customerId", "contactId");


--
-- Name: campaign_contact_exclusions_campaign_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX campaign_contact_exclusions_campaign_id_idx ON public.campaign_contact_exclusions USING btree ("campaignId");


--
-- Name: campaign_contact_exclusions_contact_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX campaign_contact_exclusions_contact_id_idx ON public.campaign_contact_exclusions USING btree ("contactId");


--
-- Name: campaign_contact_exclusions_customer_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX campaign_contact_exclusions_customer_id_idx ON public.campaign_contact_exclusions USING btree ("customerId");


--
-- Name: campaign_custom_emails_campaign_contact_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX campaign_custom_emails_campaign_contact_unique ON public.campaign_custom_emails USING btree ("campaignId", "contactId");


--
-- Name: campaign_custom_emails_campaign_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX campaign_custom_emails_campaign_id_idx ON public.campaign_custom_emails USING btree ("campaignId");


--
-- Name: campaign_custom_emails_contact_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX campaign_custom_emails_contact_id_idx ON public.campaign_custom_emails USING btree ("contactId");


--
-- Name: campaign_domains_domain_workspace_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX campaign_domains_domain_workspace_idx ON public.campaign_domains USING btree (domain, "workspaceId");


--
-- Name: campaign_domains_workspace_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX campaign_domains_workspace_id_idx ON public.campaign_domains USING btree ("workspaceId");


--
-- Name: campaign_email_templates_campaign_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX campaign_email_templates_campaign_id_idx ON public.campaign_email_templates USING btree ("campaignId");


--
-- Name: campaign_email_templates_campaign_template_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX campaign_email_templates_campaign_template_id_idx ON public.campaign_template_email_templates USING btree ("campaignTemplateId");


--
-- Name: campaign_exclusion_events_campaign_contact_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX campaign_exclusion_events_campaign_contact_idx ON public.campaign_exclusion_events USING btree ("campaignId", "contactId");


--
-- Name: campaign_exclusion_events_campaign_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX campaign_exclusion_events_campaign_id_idx ON public.campaign_exclusion_events USING btree ("campaignId");


--
-- Name: campaign_exclusion_events_contact_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX campaign_exclusion_events_contact_id_idx ON public.campaign_exclusion_events USING btree ("contactId");


--
-- Name: campaign_name_workspace_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX campaign_name_workspace_idx ON public.campaigns USING btree (name, "workspaceId");


--
-- Name: campaign_recipient_email_campaign_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX campaign_recipient_email_campaign_id_idx ON public.campaign_recipient_emails USING btree ("campaignId");


--
-- Name: campaign_recipient_email_contact_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX campaign_recipient_email_contact_id_idx ON public.campaign_recipient_emails USING btree ("contactId");


--
-- Name: campaign_recipient_email_postmark_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX campaign_recipient_email_postmark_id_idx ON public.campaign_recipient_emails USING btree ("postmarkId");


--
-- Name: campaign_recipient_email_postmark_id_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX campaign_recipient_email_postmark_id_unique ON public.campaign_recipient_emails USING btree ("postmarkId");


--
-- Name: campaign_recipient_events_event_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX campaign_recipient_events_event_type_idx ON public.campaign_recipient_events USING btree ("eventType");


--
-- Name: campaign_recipient_events_occurred_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX campaign_recipient_events_occurred_at_idx ON public.campaign_recipient_events USING btree ("occurredAt");


--
-- Name: campaign_recipient_events_recipient_email_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX campaign_recipient_events_recipient_email_id_idx ON public.campaign_recipient_events USING btree ("recipientEmailId");


--
-- Name: campaign_recipient_events_recipient_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX campaign_recipient_events_recipient_type_idx ON public.campaign_recipient_events USING btree ("recipientEmailId", "eventType");


--
-- Name: campaign_recipients_contacts_campaign_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX campaign_recipients_contacts_campaign_id_idx ON public.campaign_recipients_contacts USING btree ("campaignId");


--
-- Name: campaign_recipients_contacts_contact_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX campaign_recipients_contacts_contact_id_idx ON public.campaign_recipients_contacts USING btree ("contactId");


--
-- Name: campaign_recipients_customers_campaign_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX campaign_recipients_customers_campaign_id_idx ON public.campaign_recipients_customers USING btree ("campaignId");


--
-- Name: campaign_recipients_customers_customer_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX campaign_recipients_customers_customer_id_idx ON public.campaign_recipients_customers USING btree ("customerId");


--
-- Name: campaign_recipients_lists_campaign_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX campaign_recipients_lists_campaign_id_idx ON public.campaign_recipients_lists USING btree ("campaignId");


--
-- Name: campaign_recipients_lists_list_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX campaign_recipients_lists_list_id_idx ON public.campaign_recipients_lists USING btree ("listId");


--
-- Name: campaign_recipients_smart_lists_campaign_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX campaign_recipients_smart_lists_campaign_id_idx ON public.campaign_recipients_smart_lists USING btree ("campaignId");


--
-- Name: campaign_recipients_smart_lists_smart_list_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX campaign_recipients_smart_lists_smart_list_id_idx ON public.campaign_recipients_smart_lists USING btree ("smartListId");


--
-- Name: campaign_sender_emails_email_workspace_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX campaign_sender_emails_email_workspace_idx ON public.campaign_sender_emails USING btree (email, "workspaceId");


--
-- Name: campaign_sender_emails_workspace_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX campaign_sender_emails_workspace_id_idx ON public.campaign_sender_emails USING btree ("workspaceId");


--
-- Name: campaign_settings_campaign_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX campaign_settings_campaign_id_idx ON public.campaign_settings USING btree ("campaignId");


--
-- Name: campaign_templates_name_workspace_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX campaign_templates_name_workspace_idx ON public.campaign_templates USING btree (name, "workspaceId");


--
-- Name: campaign_templates_workspace_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX campaign_templates_workspace_id_idx ON public.campaign_templates USING btree ("workspaceId");


--
-- Name: campaign_workspace_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX campaign_workspace_id_idx ON public.campaigns USING btree ("workspaceId");


--
-- Name: category_child_name_parent_workspace_unique_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX category_child_name_parent_workspace_unique_idx ON public.categories USING btree (name, "parentId", "workspaceId") WHERE ("parentId" IS NOT NULL);


--
-- Name: category_external_id_workspace_unique_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX category_external_id_workspace_unique_idx ON public.categories USING btree ("externalId", "workspaceId");


--
-- Name: category_name_workspace_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX category_name_workspace_idx ON public.categories USING btree (name, "workspaceId");


--
-- Name: category_parent_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX category_parent_id_idx ON public.categories USING btree ("parentId");


--
-- Name: category_root_name_workspace_unique_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX category_root_name_workspace_unique_idx ON public.categories USING btree (name, "workspaceId") WHERE ("parentId" IS NULL);


--
-- Name: category_workspace_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX category_workspace_id_idx ON public.categories USING btree ("workspaceId");


--
-- Name: city_country_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX city_country_id_idx ON public.cities USING btree ("countryId");


--
-- Name: city_name_country_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX city_name_country_idx ON public.cities USING btree (name, "countryId");


--
-- Name: contacts_address_id_unique_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX contacts_address_id_unique_idx ON public.contacts USING btree ("addressId");


--
-- Name: contacts_company_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX contacts_company_idx ON public.contacts USING btree (company);


--
-- Name: contacts_data_gin_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX contacts_data_gin_idx ON public.contacts USING gin (data);


--
-- Name: contacts_email_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX contacts_email_idx ON public.contacts USING btree (email);


--
-- Name: contacts_external_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX contacts_external_id_idx ON public.contacts USING btree ("externalId");


--
-- Name: contacts_firstName_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "contacts_firstName_idx" ON public.contacts USING btree ("firstName");


--
-- Name: contacts_lastName_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "contacts_lastName_idx" ON public.contacts USING btree ("lastName");


--
-- Name: contacts_workspace_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX contacts_workspace_id_idx ON public.contacts USING btree ("workspaceId");


--
-- Name: country_iso_code_unique_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX country_iso_code_unique_idx ON public.countries USING btree ("isoCode");


--
-- Name: country_name_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX country_name_idx ON public.countries USING btree (name);


--
-- Name: coverages_external_id_workspace_unique_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX coverages_external_id_workspace_unique_idx ON public.coverages USING btree ("externalId", "workspaceId");


--
-- Name: coverages_workspace_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX coverages_workspace_id_idx ON public.coverages USING btree ("workspaceId");


--
-- Name: customer_contacts_contact_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX customer_contacts_contact_id_idx ON public.customer_contacts USING btree ("contactId");


--
-- Name: customer_contacts_customer_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX customer_contacts_customer_id_idx ON public.customer_contacts USING btree ("customerId");


--
-- Name: customer_opportunities_customer_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX customer_opportunities_customer_id_idx ON public.customer_opportunities USING btree ("customerId");


--
-- Name: customer_opportunities_opportunity_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX customer_opportunities_opportunity_id_idx ON public.customer_opportunities USING btree ("opportunityId");


--
-- Name: customer_relationships_customer_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX customer_relationships_customer_id_idx ON public.customer_relationships USING btree ("customerId");


--
-- Name: customer_relationships_related_customer_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX customer_relationships_related_customer_id_idx ON public.customer_relationships USING btree ("relatedCustomerId");


--
-- Name: customer_relationships_unique_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX customer_relationships_unique_idx ON public.customer_relationships USING btree ("customerId", "relatedCustomerId", "relationshipType");


--
-- Name: customer_team_customer_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX customer_team_customer_id_idx ON public.customer_team USING btree ("customerId");


--
-- Name: customer_team_member_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX customer_team_member_id_idx ON public.customer_team USING btree ("memberId");


--
-- Name: customers_address_id_unique_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX customers_address_id_unique_idx ON public.customers USING btree ("addressId");


--
-- Name: customers_data_gin_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX customers_data_gin_idx ON public.customers USING gin (data);


--
-- Name: customers_external_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX customers_external_id_idx ON public.customers USING btree ("externalId");


--
-- Name: customers_external_id_workspace_unique_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX customers_external_id_workspace_unique_idx ON public.customers USING btree ("externalId", "workspaceId");


--
-- Name: customers_name_workspace_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX customers_name_workspace_idx ON public.customers USING btree (name, "workspaceId");


--
-- Name: customers_owner_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX customers_owner_id_idx ON public.customers USING btree ("ownerId");


--
-- Name: customers_workspace_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX customers_workspace_id_idx ON public.customers USING btree ("workspaceId");


--
-- Name: data_import_template_attributes_template_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX data_import_template_attributes_template_id_idx ON public.data_import_template_attributes USING btree ("templateId");


--
-- Name: entity_list_configurations_entity_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX entity_list_configurations_entity_id_idx ON public.entity_list_configurations USING btree ("entityId");


--
-- Name: entity_list_configurations_entity_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX entity_list_configurations_entity_type_idx ON public.entity_list_configurations USING btree ("entityType");


--
-- Name: entity_list_configurations_member_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX entity_list_configurations_member_id_idx ON public.entity_list_configurations USING btree ("memberId");


--
-- Name: entity_list_configurations_workspace_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX entity_list_configurations_workspace_id_idx ON public.entity_list_configurations USING btree ("workspaceId");


--
-- Name: entity_list_customers_entity_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX entity_list_customers_entity_id_idx ON public.entity_list_customers USING btree ("entityId");


--
-- Name: entity_list_customers_list_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX entity_list_customers_list_id_idx ON public.entity_list_customers USING btree ("entityListId");


--
-- Name: entity_list_leads_entity_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX entity_list_leads_entity_id_idx ON public.entity_list_leads USING btree ("entityId");


--
-- Name: entity_list_leads_list_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX entity_list_leads_list_id_idx ON public.entity_list_leads USING btree ("entityListId");


--
-- Name: entity_list_opportunities_entity_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX entity_list_opportunities_entity_id_idx ON public.entity_list_opportunities USING btree ("entityId");


--
-- Name: entity_list_opportunities_list_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX entity_list_opportunities_list_id_idx ON public.entity_list_opportunities USING btree ("entityListId");


--
-- Name: entity_list_partners_entity_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX entity_list_partners_entity_id_idx ON public.entity_list_partners USING btree ("entityId");


--
-- Name: entity_list_partners_list_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX entity_list_partners_list_id_idx ON public.entity_list_partners USING btree ("entityListId");


--
-- Name: entity_list_product_templates_entity_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX entity_list_product_templates_entity_id_idx ON public.entity_list_product_templates USING btree ("entityId");


--
-- Name: entity_list_product_templates_list_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX entity_list_product_templates_list_id_idx ON public.entity_list_product_templates USING btree ("entityListId");


--
-- Name: entity_list_products_entity_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX entity_list_products_entity_id_idx ON public.entity_list_products USING btree ("entityId");


--
-- Name: entity_list_products_list_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX entity_list_products_list_id_idx ON public.entity_list_products USING btree ("entityListId");


--
-- Name: entity_lists_name_entity_type_user_id_workspace_id_unique_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX entity_lists_name_entity_type_user_id_workspace_id_unique_idx ON public.entity_lists USING btree (name, "entityType", "userId", "workspaceId");


--
-- Name: entity_lists_workspace_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX entity_lists_workspace_id_idx ON public.entity_lists USING btree ("workspaceId");


--
-- Name: entity_views_name_entity_type_workspace_id_unique_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX entity_views_name_entity_type_workspace_id_unique_idx ON public.entity_views USING btree (name, "entityType", "workspaceId");


--
-- Name: entity_views_user_entity_lookup_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX entity_views_user_entity_lookup_idx ON public.entity_views USING btree ("userId", "entityType", "entityId");


--
-- Name: global_campaign_templates_creator_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX global_campaign_templates_creator_idx ON public.global_campaign_templates USING btree (creator);


--
-- Name: global_campaign_templates_name_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX global_campaign_templates_name_idx ON public.global_campaign_templates USING btree (name);


--
-- Name: global_ct_email_templates_template_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX global_ct_email_templates_template_id_idx ON public.global_campaign_template_email_templates USING btree ("globalCampaignTemplateId");


--
-- Name: global_ct_workspaces_template_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX global_ct_workspaces_template_id_idx ON public.global_campaign_template_workspaces USING btree ("globalCampaignTemplateId");


--
-- Name: global_ct_workspaces_workspace_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX global_ct_workspaces_workspace_id_idx ON public.global_campaign_template_workspaces USING btree ("workspaceId");


--
-- Name: global_slt_workspaces_template_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX global_slt_workspaces_template_id_idx ON public.global_smart_list_template_workspaces USING btree ("globalSmartListTemplateId");


--
-- Name: global_slt_workspaces_workspace_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX global_slt_workspaces_workspace_id_idx ON public.global_smart_list_template_workspaces USING btree ("workspaceId");


--
-- Name: global_smart_list_templates_category_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX global_smart_list_templates_category_idx ON public.global_smart_list_templates USING btree (category);


--
-- Name: global_smart_list_templates_creator_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX global_smart_list_templates_creator_idx ON public.global_smart_list_templates USING btree (creator);


--
-- Name: invites_email_unique_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX invites_email_unique_idx ON public.invites USING btree (email, "workspaceId");


--
-- Name: key_metric_instances_has_traffic_light_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX key_metric_instances_has_traffic_light_idx ON public.key_metric_instances USING btree ("hasTrafficLight");


--
-- Name: key_metric_instances_hierarchy_level_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX key_metric_instances_hierarchy_level_idx ON public.key_metric_instances USING btree ("hierarchyLevel");


--
-- Name: key_metric_instances_measurement_unit_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX key_metric_instances_measurement_unit_idx ON public.key_metric_instances USING btree ("measurementUnit");


--
-- Name: key_metric_instances_parent_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX key_metric_instances_parent_id_idx ON public.key_metric_instances USING btree ("parentId");


--
-- Name: key_metric_instances_partner_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX key_metric_instances_partner_id_idx ON public.key_metric_instances USING btree ("partnerId");


--
-- Name: key_metric_instances_tag_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX key_metric_instances_tag_id_idx ON public.key_metric_instances USING btree ("tagId");


--
-- Name: key_metric_instances_template_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX key_metric_instances_template_id_idx ON public.key_metric_instances USING btree ("keyMetricTemplateId");


--
-- Name: key_metric_instances_template_partner_workspace_unique_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX key_metric_instances_template_partner_workspace_unique_idx ON public.key_metric_instances USING btree ("keyMetricTemplateId", "partnerId", "workspaceId") WHERE (deleted = false);


--
-- Name: key_metric_instances_timeframe_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX key_metric_instances_timeframe_type_idx ON public.key_metric_instances USING btree ("timeframeType");


--
-- Name: key_metric_instances_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX key_metric_instances_type_idx ON public.key_metric_instances USING btree (type);


--
-- Name: key_metric_instances_workspace_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX key_metric_instances_workspace_id_idx ON public.key_metric_instances USING btree ("workspaceId");


--
-- Name: key_metric_milestones_end_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX key_metric_milestones_end_at_idx ON public.key_metric_milestones USING btree ("endAt");


--
-- Name: key_metric_milestones_instance_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX key_metric_milestones_instance_id_idx ON public.key_metric_milestones USING btree ("keyMetricInstanceId");


--
-- Name: key_metric_milestones_start_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX key_metric_milestones_start_at_idx ON public.key_metric_milestones USING btree ("startAt");


--
-- Name: key_metric_realized_history_instance_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX key_metric_realized_history_instance_id_idx ON public.key_metric_realized_history USING btree ("keyMetricInstanceId");


--
-- Name: key_metric_realized_history_milestone_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX key_metric_realized_history_milestone_id_idx ON public.key_metric_realized_history USING btree ("milestoneId");


--
-- Name: key_metric_realized_history_updated_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX key_metric_realized_history_updated_at_idx ON public.key_metric_realized_history USING btree ("updatedAt");


--
-- Name: key_metric_realized_history_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX key_metric_realized_history_user_id_idx ON public.key_metric_realized_history USING btree ("userId");


--
-- Name: key_metric_tag_category_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX key_metric_tag_category_id_idx ON public.key_metric_tags USING btree ("categoryId");


--
-- Name: key_metric_tag_category_name_workspace_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX key_metric_tag_category_name_workspace_idx ON public.key_metric_tag_categories USING btree (name, "workspaceId");


--
-- Name: key_metric_tag_category_name_workspace_unique_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX key_metric_tag_category_name_workspace_unique_idx ON public.key_metric_tag_categories USING btree (name, "workspaceId");


--
-- Name: key_metric_tag_category_workspace_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX key_metric_tag_category_workspace_id_idx ON public.key_metric_tag_categories USING btree ("workspaceId");


--
-- Name: key_metric_tag_name_workspace_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX key_metric_tag_name_workspace_idx ON public.key_metric_tags USING btree (name, "workspaceId");


--
-- Name: key_metric_tag_name_workspace_unique_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX key_metric_tag_name_workspace_unique_idx ON public.key_metric_tags USING btree (name, "workspaceId");


--
-- Name: key_metric_tag_workspace_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX key_metric_tag_workspace_id_idx ON public.key_metric_tags USING btree ("workspaceId");


--
-- Name: key_metric_templates_has_traffic_light_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX key_metric_templates_has_traffic_light_idx ON public.key_metric_templates USING btree ("hasTrafficLight");


--
-- Name: key_metric_templates_hierarchy_level_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX key_metric_templates_hierarchy_level_idx ON public.key_metric_templates USING btree ("hierarchyLevel");


--
-- Name: key_metric_templates_measurement_unit_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX key_metric_templates_measurement_unit_idx ON public.key_metric_templates USING btree ("measurementUnit");


--
-- Name: key_metric_templates_name_workspace_id_unique_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX key_metric_templates_name_workspace_id_unique_idx ON public.key_metric_templates USING btree (name, "workspaceId");


--
-- Name: key_metric_templates_parent_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX key_metric_templates_parent_id_idx ON public.key_metric_templates USING btree ("parentId");


--
-- Name: key_metric_templates_tag_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX key_metric_templates_tag_id_idx ON public.key_metric_templates USING btree ("tagId");


--
-- Name: key_metric_templates_timeframe_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX key_metric_templates_timeframe_type_idx ON public.key_metric_templates USING btree ("timeframeType");


--
-- Name: key_metric_templates_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX key_metric_templates_type_idx ON public.key_metric_templates USING btree (type);


--
-- Name: key_metric_templates_workspace_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX key_metric_templates_workspace_id_idx ON public.key_metric_templates USING btree ("workspaceId");


--
-- Name: leads_email_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX leads_email_idx ON public.leads USING btree (email);


--
-- Name: leads_external_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX leads_external_id_idx ON public.leads USING btree ("externalId");


--
-- Name: leads_owner_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX leads_owner_id_idx ON public.leads USING btree ("ownerId");


--
-- Name: leads_source_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX leads_source_idx ON public.leads USING btree (source);


--
-- Name: leads_workspace_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX leads_workspace_id_idx ON public.leads USING btree ("workspaceId");


--
-- Name: members_unique_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX members_unique_idx ON public.members USING btree ("userId", "workspaceId");


--
-- Name: members_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX members_user_id_idx ON public.members USING btree ("userId");


--
-- Name: members_workspace_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX members_workspace_id_idx ON public.members USING btree ("workspaceId");


--
-- Name: opportunities_created_by_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX opportunities_created_by_idx ON public.opportunities USING btree ("createdBy");


--
-- Name: opportunities_customer_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX opportunities_customer_id_idx ON public.opportunities USING btree ("customerId");


--
-- Name: opportunities_external_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX opportunities_external_id_idx ON public.opportunities USING btree ("externalId");


--
-- Name: opportunities_owner_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX opportunities_owner_id_idx ON public.opportunities USING btree ("ownerId");


--
-- Name: opportunities_policy_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX opportunities_policy_id_idx ON public.opportunities USING btree ("policyId");


--
-- Name: opportunities_stage_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX opportunities_stage_idx ON public.opportunities USING btree (stage);


--
-- Name: opportunities_team_member_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX opportunities_team_member_id_idx ON public.opportunities_team USING btree ("memberId");


--
-- Name: opportunities_team_opportunity_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX opportunities_team_opportunity_id_idx ON public.opportunities_team USING btree ("opportunityId");


--
-- Name: opportunities_updated_by_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX opportunities_updated_by_idx ON public.opportunities USING btree ("updatedBy");


--
-- Name: opportunities_workspace_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX opportunities_workspace_created_at_idx ON public.opportunities USING btree ("workspaceId", "createdAt");


--
-- Name: opportunities_workspace_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX opportunities_workspace_id_idx ON public.opportunities USING btree ("workspaceId");


--
-- Name: opportunities_workspace_updated_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX opportunities_workspace_updated_at_idx ON public.opportunities USING btree ("workspaceId", "updatedAt");


--
-- Name: opportunity_comments_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX opportunity_comments_created_at_idx ON public.opportunity_comments USING btree ("createdAt");


--
-- Name: opportunity_comments_member_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX opportunity_comments_member_id_idx ON public.opportunity_comments USING btree ("memberId");


--
-- Name: opportunity_comments_opportunity_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX opportunity_comments_opportunity_id_idx ON public.opportunity_comments USING btree ("opportunityId");


--
-- Name: opportunity_comments_space_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX opportunity_comments_space_user_id_idx ON public.opportunity_comments USING btree ("spaceUserId");


--
-- Name: opportunity_comments_workspace_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX opportunity_comments_workspace_id_idx ON public.opportunity_comments USING btree ("workspaceId");


--
-- Name: partner_customers_customer_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX partner_customers_customer_id_idx ON public.partner_customers USING btree ("customerId");


--
-- Name: partner_customers_partner_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX partner_customers_partner_id_idx ON public.partner_customers USING btree ("partnerId");


--
-- Name: partner_opportunities_opportunity_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX partner_opportunities_opportunity_id_idx ON public.partner_opportunities USING btree ("opportunityId");


--
-- Name: partner_opportunities_partner_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX partner_opportunities_partner_id_idx ON public.partner_opportunities USING btree ("partnerId");


--
-- Name: partner_team_member_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX partner_team_member_id_idx ON public.partner_team USING btree ("memberId");


--
-- Name: partner_team_partner_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX partner_team_partner_id_idx ON public.partner_team USING btree ("partnerId");


--
-- Name: partners_data_gin_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX partners_data_gin_idx ON public.partners USING gin (data);


--
-- Name: partners_external_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX partners_external_id_idx ON public.partners USING btree ("externalId");


--
-- Name: partners_external_id_workspace_unique_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX partners_external_id_workspace_unique_idx ON public.partners USING btree ("externalId", "workspaceId");


--
-- Name: partners_name_workspace_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX partners_name_workspace_idx ON public.partners USING btree (name, "workspaceId");


--
-- Name: partners_owner_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX partners_owner_id_idx ON public.partners USING btree ("ownerId");


--
-- Name: partners_workspace_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX partners_workspace_id_idx ON public.partners USING btree ("workspaceId");


--
-- Name: postal_code_city_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX postal_code_city_id_idx ON public.postal_codes USING btree ("cityId");


--
-- Name: postal_code_code_country_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX postal_code_code_country_idx ON public.postal_codes USING btree (code, "countryId");


--
-- Name: postal_code_country_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX postal_code_country_id_idx ON public.postal_codes USING btree ("countryId");


--
-- Name: product_partners_partner_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX product_partners_partner_id_idx ON public.product_partners USING btree ("partnerId");


--
-- Name: product_partners_product_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX product_partners_product_id_idx ON public.product_partners USING btree ("productId");


--
-- Name: product_risk_objects_product_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX product_risk_objects_product_id_idx ON public.product_risk_objects USING btree ("productId");


--
-- Name: product_risk_objects_risk_object_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX product_risk_objects_risk_object_id_idx ON public.product_risk_objects USING btree ("riskObjectId");


--
-- Name: product_templates_category_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX product_templates_category_id_idx ON public.product_templates USING btree ("categoryId");


--
-- Name: product_templates_created_by_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX product_templates_created_by_idx ON public.product_templates USING btree ("createdBy");


--
-- Name: product_templates_data_gin_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX product_templates_data_gin_idx ON public.product_templates USING gin (data);


--
-- Name: product_templates_external_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX product_templates_external_id_idx ON public.product_templates USING btree ("externalId");


--
-- Name: product_templates_external_id_workspace_unique_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX product_templates_external_id_workspace_unique_idx ON public.product_templates USING btree ("externalId", "workspaceId");


--
-- Name: product_templates_insurer_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX product_templates_insurer_id_idx ON public.product_templates USING btree ("insurerId");


--
-- Name: product_templates_updated_by_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX product_templates_updated_by_idx ON public.product_templates USING btree ("updatedBy");


--
-- Name: product_templates_workspace_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX product_templates_workspace_created_at_idx ON public.product_templates USING btree ("workspaceId", "createdAt");


--
-- Name: product_templates_workspace_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX product_templates_workspace_id_idx ON public.product_templates USING btree ("workspaceId");


--
-- Name: product_templates_workspace_updated_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX product_templates_workspace_updated_at_idx ON public.product_templates USING btree ("workspaceId", "updatedAt");


--
-- Name: products_contract_id_workspace_unique_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX products_contract_id_workspace_unique_idx ON public.products USING btree ("contractId", "workspaceId");


--
-- Name: products_created_by_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX products_created_by_idx ON public.products USING btree ("createdBy");


--
-- Name: products_customer_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX products_customer_id_idx ON public.products USING btree ("customerId");


--
-- Name: products_data_gin_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX products_data_gin_idx ON public.products USING gin (data);


--
-- Name: products_external_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX products_external_id_idx ON public.products USING btree ("externalId");


--
-- Name: products_external_id_workspace_unique_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX products_external_id_workspace_unique_idx ON public.products USING btree ("externalId", "workspaceId");


--
-- Name: products_insurer_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX products_insurer_id_idx ON public.products USING btree ("insurerId");


--
-- Name: products_lifecycle_stage_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX products_lifecycle_stage_idx ON public.products USING btree ("lifecycleStage");


--
-- Name: products_opportunity_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX products_opportunity_id_idx ON public.products USING btree ("opportunityId");


--
-- Name: products_product_category_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX products_product_category_id_idx ON public.products USING btree ("productCategoryId");


--
-- Name: products_product_template_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX products_product_template_id_idx ON public.products USING btree ("productTemplateId");


--
-- Name: products_updated_by_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX products_updated_by_idx ON public.products USING btree ("updatedBy");


--
-- Name: products_workspace_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX products_workspace_created_at_idx ON public.products USING btree ("workspaceId", "createdAt");


--
-- Name: products_workspace_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX products_workspace_id_idx ON public.products USING btree ("workspaceId");


--
-- Name: products_workspace_updated_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX products_workspace_updated_at_idx ON public.products USING btree ("workspaceId", "updatedAt");


--
-- Name: risk_object_coverages_coverage_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX risk_object_coverages_coverage_id_idx ON public.risk_object_coverages USING btree ("coverageId");


--
-- Name: risk_object_coverages_risk_object_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX risk_object_coverages_risk_object_id_idx ON public.risk_object_coverages USING btree ("riskObjectId");


--
-- Name: risk_objects_external_id_workspace_unique_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX risk_objects_external_id_workspace_unique_idx ON public.risk_objects USING btree ("externalId", "workspaceId");


--
-- Name: risk_objects_workspace_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX risk_objects_workspace_id_idx ON public.risk_objects USING btree ("workspaceId");


--
-- Name: shares_from_workspace_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX shares_from_workspace_id_idx ON public.shares USING btree ("fromWorkspaceId");


--
-- Name: shares_resources_resource_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX shares_resources_resource_id_idx ON public.shares_resources USING btree ("resourceId");


--
-- Name: shares_resources_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX shares_resources_type_idx ON public.shares_resources USING btree (type);


--
-- Name: shares_share_resource_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX shares_share_resource_id_idx ON public.shares USING btree ("shareResourceId");


--
-- Name: shares_shared_by_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX shares_shared_by_id_idx ON public.shares USING btree ("sharedById");


--
-- Name: shares_shared_with_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX shares_shared_with_id_idx ON public.shares USING btree ("sharedWithId");


--
-- Name: shares_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX shares_status_idx ON public.shares USING btree (status);


--
-- Name: shares_token_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX shares_token_idx ON public.shares USING btree (token);


--
-- Name: smart_list_templates_category_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX smart_list_templates_category_idx ON public.smart_list_templates USING btree (category);


--
-- Name: smart_list_templates_workspace_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX smart_list_templates_workspace_id_idx ON public.smart_list_templates USING btree ("workspaceId");


--
-- Name: smart_lists_global_template_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX smart_lists_global_template_id_idx ON public.smart_lists USING btree ("globalSmartListTemplateId");


--
-- Name: smart_lists_template_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX smart_lists_template_id_idx ON public.smart_lists USING btree ("smartListTemplateId");


--
-- Name: smart_lists_workspace_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX smart_lists_workspace_id_idx ON public.smart_lists USING btree ("workspaceId");


--
-- Name: tags_workspace_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tags_workspace_id_idx ON public.tags USING btree ("workspaceId");


--
-- Name: user_workspace_settings_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_workspace_settings_user_id_idx ON public.user_workspace_settings USING btree ("userId");


--
-- Name: user_workspace_settings_user_workspace_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX user_workspace_settings_user_workspace_idx ON public.user_workspace_settings USING btree ("userId", "workspaceId");


--
-- Name: user_workspace_settings_workspace_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_workspace_settings_workspace_id_idx ON public.user_workspace_settings USING btree ("workspaceId");


--
-- Name: users_email_unique_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_email_unique_idx ON public.users USING btree (email);


--
-- Name: workspace_entity_list_configurations_entity_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX workspace_entity_list_configurations_entity_type_idx ON public.workspace_entity_list_configurations USING btree ("entityType");


--
-- Name: workspace_entity_list_configurations_workspace_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX workspace_entity_list_configurations_workspace_id_idx ON public.workspace_entity_list_configurations USING btree ("workspaceId");


--
-- Name: jobs_main_index; Type: INDEX; Schema: worker; Owner: -
--

CREATE INDEX jobs_main_index ON worker._private_jobs USING btree (priority, run_at) INCLUDE (id, task_id, job_queue_id) WHERE (is_available = true);


--
-- Name: jobs_no_queue_index; Type: INDEX; Schema: worker; Owner: -
--

CREATE INDEX jobs_no_queue_index ON worker._private_jobs USING btree (priority, run_at) INCLUDE (id, task_id) WHERE ((is_available = true) AND (job_queue_id IS NULL));


--
-- Name: activity_logs activity_logs_userId_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT "activity_logs_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: activity_logs activity_logs_workspaceId_workspaces_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT "activity_logs_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: addresses addresses_cityId_cities_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT "addresses_cityId_cities_id_fk" FOREIGN KEY ("cityId") REFERENCES public.cities(id) ON DELETE SET NULL;


--
-- Name: addresses addresses_countryId_countries_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT "addresses_countryId_countries_id_fk" FOREIGN KEY ("countryId") REFERENCES public.countries(id) ON DELETE RESTRICT;


--
-- Name: addresses addresses_postalCodeId_postal_codes_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT "addresses_postalCodeId_postal_codes_id_fk" FOREIGN KEY ("postalCodeId") REFERENCES public.postal_codes(id) ON DELETE SET NULL;


--
-- Name: addresses addresses_workspaceId_workspaces_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT "addresses_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: anonymous_users anonymous_users_userId_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.anonymous_users
    ADD CONSTRAINT "anonymous_users_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: attributes attributes_workspaceId_workspaces_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attributes
    ADD CONSTRAINT "attributes_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: campaign_contact_exclusions campaign_contact_exclusions_campaignId_campaigns_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_contact_exclusions
    ADD CONSTRAINT "campaign_contact_exclusions_campaignId_campaigns_id_fk" FOREIGN KEY ("campaignId") REFERENCES public.campaigns(id) ON DELETE CASCADE;


--
-- Name: campaign_contact_exclusions campaign_contact_exclusions_contactId_contacts_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_contact_exclusions
    ADD CONSTRAINT "campaign_contact_exclusions_contactId_contacts_id_fk" FOREIGN KEY ("contactId") REFERENCES public.contacts(id) ON DELETE CASCADE;


--
-- Name: campaign_contact_exclusions campaign_contact_exclusions_customerId_customers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_contact_exclusions
    ADD CONSTRAINT "campaign_contact_exclusions_customerId_customers_id_fk" FOREIGN KEY ("customerId") REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: campaign_contact_exclusions campaign_contact_exclusions_excludedByMemberId_members_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_contact_exclusions
    ADD CONSTRAINT "campaign_contact_exclusions_excludedByMemberId_members_id_fk" FOREIGN KEY ("excludedByMemberId") REFERENCES public.members(id);


--
-- Name: campaign_custom_emails campaign_custom_emails_campaignId_campaigns_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_custom_emails
    ADD CONSTRAINT "campaign_custom_emails_campaignId_campaigns_id_fk" FOREIGN KEY ("campaignId") REFERENCES public.campaigns(id) ON DELETE CASCADE;


--
-- Name: campaign_custom_emails campaign_custom_emails_contactId_contacts_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_custom_emails
    ADD CONSTRAINT "campaign_custom_emails_contactId_contacts_id_fk" FOREIGN KEY ("contactId") REFERENCES public.contacts(id) ON DELETE CASCADE;


--
-- Name: campaign_domains campaign_domains_workspaceId_workspaces_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_domains
    ADD CONSTRAINT "campaign_domains_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: campaign_email_templates campaign_email_templates_campaignId_campaigns_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_email_templates
    ADD CONSTRAINT "campaign_email_templates_campaignId_campaigns_id_fk" FOREIGN KEY ("campaignId") REFERENCES public.campaigns(id) ON DELETE CASCADE;


--
-- Name: campaign_exclusion_events campaign_exclusion_events_campaignId_campaigns_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_exclusion_events
    ADD CONSTRAINT "campaign_exclusion_events_campaignId_campaigns_id_fk" FOREIGN KEY ("campaignId") REFERENCES public.campaigns(id) ON DELETE CASCADE;


--
-- Name: campaign_exclusion_events campaign_exclusion_events_contactId_contacts_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_exclusion_events
    ADD CONSTRAINT "campaign_exclusion_events_contactId_contacts_id_fk" FOREIGN KEY ("contactId") REFERENCES public.contacts(id) ON DELETE CASCADE;


--
-- Name: campaign_exclusion_events campaign_exclusion_events_customerId_customers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_exclusion_events
    ADD CONSTRAINT "campaign_exclusion_events_customerId_customers_id_fk" FOREIGN KEY ("customerId") REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: campaign_exclusion_events campaign_exclusion_events_performedByMemberId_members_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_exclusion_events
    ADD CONSTRAINT "campaign_exclusion_events_performedByMemberId_members_id_fk" FOREIGN KEY ("performedByMemberId") REFERENCES public.members(id);


--
-- Name: campaign_recipient_emails campaign_recipient_emails_campaignId_campaigns_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_recipient_emails
    ADD CONSTRAINT "campaign_recipient_emails_campaignId_campaigns_id_fk" FOREIGN KEY ("campaignId") REFERENCES public.campaigns(id) ON DELETE CASCADE;


--
-- Name: campaign_recipient_emails campaign_recipient_emails_contactId_contacts_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_recipient_emails
    ADD CONSTRAINT "campaign_recipient_emails_contactId_contacts_id_fk" FOREIGN KEY ("contactId") REFERENCES public.contacts(id) ON DELETE CASCADE;


--
-- Name: campaign_recipient_events campaign_recipient_events_recipientEmailId_campaign_recipient_e; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_recipient_events
    ADD CONSTRAINT "campaign_recipient_events_recipientEmailId_campaign_recipient_e" FOREIGN KEY ("recipientEmailId") REFERENCES public.campaign_recipient_emails(id) ON DELETE CASCADE;


--
-- Name: campaign_recipients_contacts campaign_recipients_contacts_campaignId_campaigns_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_recipients_contacts
    ADD CONSTRAINT "campaign_recipients_contacts_campaignId_campaigns_id_fk" FOREIGN KEY ("campaignId") REFERENCES public.campaigns(id) ON DELETE CASCADE;


--
-- Name: campaign_recipients_contacts campaign_recipients_contacts_contactId_contacts_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_recipients_contacts
    ADD CONSTRAINT "campaign_recipients_contacts_contactId_contacts_id_fk" FOREIGN KEY ("contactId") REFERENCES public.contacts(id) ON DELETE CASCADE;


--
-- Name: campaign_recipients_customers campaign_recipients_customers_campaignId_campaigns_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_recipients_customers
    ADD CONSTRAINT "campaign_recipients_customers_campaignId_campaigns_id_fk" FOREIGN KEY ("campaignId") REFERENCES public.campaigns(id) ON DELETE CASCADE;


--
-- Name: campaign_recipients_customers campaign_recipients_customers_customerId_customers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_recipients_customers
    ADD CONSTRAINT "campaign_recipients_customers_customerId_customers_id_fk" FOREIGN KEY ("customerId") REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: campaign_recipients_lists campaign_recipients_lists_campaignId_campaigns_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_recipients_lists
    ADD CONSTRAINT "campaign_recipients_lists_campaignId_campaigns_id_fk" FOREIGN KEY ("campaignId") REFERENCES public.campaigns(id) ON DELETE CASCADE;


--
-- Name: campaign_recipients_lists campaign_recipients_lists_listId_entity_lists_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_recipients_lists
    ADD CONSTRAINT "campaign_recipients_lists_listId_entity_lists_id_fk" FOREIGN KEY ("listId") REFERENCES public.entity_lists(id) ON DELETE CASCADE;


--
-- Name: campaign_recipients_smart_lists campaign_recipients_smart_lists_campaignId_campaigns_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_recipients_smart_lists
    ADD CONSTRAINT "campaign_recipients_smart_lists_campaignId_campaigns_id_fk" FOREIGN KEY ("campaignId") REFERENCES public.campaigns(id) ON DELETE CASCADE;


--
-- Name: campaign_recipients_smart_lists campaign_recipients_smart_lists_smartListId_smart_lists_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_recipients_smart_lists
    ADD CONSTRAINT "campaign_recipients_smart_lists_smartListId_smart_lists_id_fk" FOREIGN KEY ("smartListId") REFERENCES public.smart_lists(id) ON DELETE CASCADE;


--
-- Name: campaign_sender_emails campaign_sender_emails_workspaceId_workspaces_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_sender_emails
    ADD CONSTRAINT "campaign_sender_emails_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: campaign_settings campaign_settings_campaignId_campaigns_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_settings
    ADD CONSTRAINT "campaign_settings_campaignId_campaigns_id_fk" FOREIGN KEY ("campaignId") REFERENCES public.campaigns(id) ON DELETE CASCADE;


--
-- Name: campaign_template_email_templates campaign_template_email_templates_campaignTemplateId_campaign_t; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_template_email_templates
    ADD CONSTRAINT "campaign_template_email_templates_campaignTemplateId_campaign_t" FOREIGN KEY ("campaignTemplateId") REFERENCES public.campaign_templates(id) ON DELETE CASCADE;


--
-- Name: campaign_templates campaign_templates_workspaceId_workspaces_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_templates
    ADD CONSTRAINT "campaign_templates_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: campaigns campaigns_workspaceId_workspaces_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaigns
    ADD CONSTRAINT "campaigns_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: categories categories_createdBy_members_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT "categories_createdBy_members_id_fk" FOREIGN KEY ("createdBy") REFERENCES public.members(id) ON DELETE SET NULL;


--
-- Name: categories categories_parentId_categories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT "categories_parentId_categories_id_fk" FOREIGN KEY ("parentId") REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- Name: categories categories_updatedBy_members_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT "categories_updatedBy_members_id_fk" FOREIGN KEY ("updatedBy") REFERENCES public.members(id) ON DELETE SET NULL;


--
-- Name: categories categories_workspaceId_workspaces_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT "categories_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: cities cities_countryId_countries_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cities
    ADD CONSTRAINT "cities_countryId_countries_id_fk" FOREIGN KEY ("countryId") REFERENCES public.countries(id) ON DELETE RESTRICT;


--
-- Name: contacts contacts_addressId_addresses_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT "contacts_addressId_addresses_id_fk" FOREIGN KEY ("addressId") REFERENCES public.addresses(id) ON DELETE SET NULL;


--
-- Name: contacts contacts_createdBy_members_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT "contacts_createdBy_members_id_fk" FOREIGN KEY ("createdBy") REFERENCES public.members(id) ON DELETE SET NULL;


--
-- Name: contacts contacts_updatedBy_members_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT "contacts_updatedBy_members_id_fk" FOREIGN KEY ("updatedBy") REFERENCES public.members(id) ON DELETE SET NULL;


--
-- Name: contacts contacts_workspaceId_workspaces_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT "contacts_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: coverages coverages_createdBy_members_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coverages
    ADD CONSTRAINT "coverages_createdBy_members_id_fk" FOREIGN KEY ("createdBy") REFERENCES public.members(id) ON DELETE SET NULL;


--
-- Name: coverages coverages_updatedBy_members_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coverages
    ADD CONSTRAINT "coverages_updatedBy_members_id_fk" FOREIGN KEY ("updatedBy") REFERENCES public.members(id) ON DELETE SET NULL;


--
-- Name: coverages coverages_workspaceId_workspaces_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coverages
    ADD CONSTRAINT "coverages_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: customer_contacts customer_contacts_contactId_contacts_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_contacts
    ADD CONSTRAINT "customer_contacts_contactId_contacts_id_fk" FOREIGN KEY ("contactId") REFERENCES public.contacts(id) ON DELETE CASCADE;


--
-- Name: customer_contacts customer_contacts_customerId_customers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_contacts
    ADD CONSTRAINT "customer_contacts_customerId_customers_id_fk" FOREIGN KEY ("customerId") REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: customer_opportunities customer_opportunities_customerId_customers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_opportunities
    ADD CONSTRAINT "customer_opportunities_customerId_customers_id_fk" FOREIGN KEY ("customerId") REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: customer_opportunities customer_opportunities_opportunityId_opportunities_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_opportunities
    ADD CONSTRAINT "customer_opportunities_opportunityId_opportunities_id_fk" FOREIGN KEY ("opportunityId") REFERENCES public.opportunities(id) ON DELETE CASCADE;


--
-- Name: customer_relationships customer_relationships_customerId_customers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_relationships
    ADD CONSTRAINT "customer_relationships_customerId_customers_id_fk" FOREIGN KEY ("customerId") REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: customer_relationships customer_relationships_relatedCustomerId_customers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_relationships
    ADD CONSTRAINT "customer_relationships_relatedCustomerId_customers_id_fk" FOREIGN KEY ("relatedCustomerId") REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: customer_relationships customer_relationships_workspaceId_workspaces_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_relationships
    ADD CONSTRAINT "customer_relationships_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: customer_team customer_team_customerId_customers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_team
    ADD CONSTRAINT "customer_team_customerId_customers_id_fk" FOREIGN KEY ("customerId") REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: customer_team customer_team_memberId_members_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_team
    ADD CONSTRAINT "customer_team_memberId_members_id_fk" FOREIGN KEY ("memberId") REFERENCES public.members(id) ON DELETE CASCADE;


--
-- Name: customers customers_addressId_addresses_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT "customers_addressId_addresses_id_fk" FOREIGN KEY ("addressId") REFERENCES public.addresses(id) ON DELETE SET NULL;


--
-- Name: customers customers_createdBy_members_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT "customers_createdBy_members_id_fk" FOREIGN KEY ("createdBy") REFERENCES public.members(id) ON DELETE SET NULL;


--
-- Name: customers customers_ownerId_members_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT "customers_ownerId_members_id_fk" FOREIGN KEY ("ownerId") REFERENCES public.members(id) ON DELETE SET NULL;


--
-- Name: customers customers_updatedBy_members_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT "customers_updatedBy_members_id_fk" FOREIGN KEY ("updatedBy") REFERENCES public.members(id) ON DELETE SET NULL;


--
-- Name: customers customers_workspaceId_workspaces_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT "customers_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: data_import_template_attributes data_import_template_attributes_templateId_data_import_template; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.data_import_template_attributes
    ADD CONSTRAINT "data_import_template_attributes_templateId_data_import_template" FOREIGN KEY ("templateId") REFERENCES public.data_import_templates(id) ON DELETE CASCADE;


--
-- Name: data_import_templates data_import_templates_workspaceId_workspaces_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.data_import_templates
    ADD CONSTRAINT "data_import_templates_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: entity_list_configurations entity_list_configurations_listId_entity_lists_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entity_list_configurations
    ADD CONSTRAINT "entity_list_configurations_listId_entity_lists_id_fk" FOREIGN KEY ("listId") REFERENCES public.entity_lists(id) ON DELETE CASCADE;


--
-- Name: entity_list_configurations entity_list_configurations_memberId_members_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entity_list_configurations
    ADD CONSTRAINT "entity_list_configurations_memberId_members_id_fk" FOREIGN KEY ("memberId") REFERENCES public.members(id) ON DELETE CASCADE;


--
-- Name: entity_list_configurations entity_list_configurations_workspaceId_workspaces_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entity_list_configurations
    ADD CONSTRAINT "entity_list_configurations_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: entity_list_customers entity_list_customers_entityId_customers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entity_list_customers
    ADD CONSTRAINT "entity_list_customers_entityId_customers_id_fk" FOREIGN KEY ("entityId") REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: entity_list_customers entity_list_customers_entityListId_entity_lists_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entity_list_customers
    ADD CONSTRAINT "entity_list_customers_entityListId_entity_lists_id_fk" FOREIGN KEY ("entityListId") REFERENCES public.entity_lists(id) ON DELETE CASCADE;


--
-- Name: entity_list_leads entity_list_leads_entityId_leads_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entity_list_leads
    ADD CONSTRAINT "entity_list_leads_entityId_leads_id_fk" FOREIGN KEY ("entityId") REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- Name: entity_list_leads entity_list_leads_entityListId_entity_lists_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entity_list_leads
    ADD CONSTRAINT "entity_list_leads_entityListId_entity_lists_id_fk" FOREIGN KEY ("entityListId") REFERENCES public.entity_lists(id) ON DELETE CASCADE;


--
-- Name: entity_list_opportunities entity_list_opportunities_entityId_opportunities_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entity_list_opportunities
    ADD CONSTRAINT "entity_list_opportunities_entityId_opportunities_id_fk" FOREIGN KEY ("entityId") REFERENCES public.opportunities(id) ON DELETE CASCADE;


--
-- Name: entity_list_opportunities entity_list_opportunities_entityListId_entity_lists_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entity_list_opportunities
    ADD CONSTRAINT "entity_list_opportunities_entityListId_entity_lists_id_fk" FOREIGN KEY ("entityListId") REFERENCES public.entity_lists(id) ON DELETE CASCADE;


--
-- Name: entity_list_partners entity_list_partners_entityId_partners_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entity_list_partners
    ADD CONSTRAINT "entity_list_partners_entityId_partners_id_fk" FOREIGN KEY ("entityId") REFERENCES public.partners(id) ON DELETE CASCADE;


--
-- Name: entity_list_partners entity_list_partners_entityListId_entity_lists_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entity_list_partners
    ADD CONSTRAINT "entity_list_partners_entityListId_entity_lists_id_fk" FOREIGN KEY ("entityListId") REFERENCES public.entity_lists(id) ON DELETE CASCADE;


--
-- Name: entity_list_product_templates entity_list_product_templates_entityId_product_templates_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entity_list_product_templates
    ADD CONSTRAINT "entity_list_product_templates_entityId_product_templates_id_fk" FOREIGN KEY ("entityId") REFERENCES public.product_templates(id) ON DELETE CASCADE;


--
-- Name: entity_list_product_templates entity_list_product_templates_entityListId_entity_lists_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entity_list_product_templates
    ADD CONSTRAINT "entity_list_product_templates_entityListId_entity_lists_id_fk" FOREIGN KEY ("entityListId") REFERENCES public.entity_lists(id) ON DELETE CASCADE;


--
-- Name: entity_list_products entity_list_products_entityId_products_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entity_list_products
    ADD CONSTRAINT "entity_list_products_entityId_products_id_fk" FOREIGN KEY ("entityId") REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: entity_list_products entity_list_products_entityListId_entity_lists_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entity_list_products
    ADD CONSTRAINT "entity_list_products_entityListId_entity_lists_id_fk" FOREIGN KEY ("entityListId") REFERENCES public.entity_lists(id) ON DELETE CASCADE;


--
-- Name: entity_lists entity_lists_userId_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entity_lists
    ADD CONSTRAINT "entity_lists_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: entity_lists entity_lists_workspaceId_workspaces_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entity_lists
    ADD CONSTRAINT "entity_lists_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: entity_views entity_views_userId_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entity_views
    ADD CONSTRAINT "entity_views_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: entity_views entity_views_workspaceId_workspaces_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entity_views
    ADD CONSTRAINT "entity_views_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: global_campaign_template_email_templates global_campaign_template_email_templates_globalCampaignTemplate; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.global_campaign_template_email_templates
    ADD CONSTRAINT "global_campaign_template_email_templates_globalCampaignTemplate" FOREIGN KEY ("globalCampaignTemplateId") REFERENCES public.global_campaign_templates(id) ON DELETE CASCADE;


--
-- Name: global_campaign_template_workspaces global_campaign_template_workspaces_globalCampaignTemplateId_gl; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.global_campaign_template_workspaces
    ADD CONSTRAINT "global_campaign_template_workspaces_globalCampaignTemplateId_gl" FOREIGN KEY ("globalCampaignTemplateId") REFERENCES public.global_campaign_templates(id) ON DELETE CASCADE;


--
-- Name: global_campaign_template_workspaces global_campaign_template_workspaces_workspaceId_workspaces_id_f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.global_campaign_template_workspaces
    ADD CONSTRAINT "global_campaign_template_workspaces_workspaceId_workspaces_id_f" FOREIGN KEY ("workspaceId") REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: global_smart_list_template_workspaces global_smart_list_template_workspaces_globalSmartListTemplateId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.global_smart_list_template_workspaces
    ADD CONSTRAINT "global_smart_list_template_workspaces_globalSmartListTemplateId" FOREIGN KEY ("globalSmartListTemplateId") REFERENCES public.global_smart_list_templates(id) ON DELETE CASCADE;


--
-- Name: global_smart_list_template_workspaces global_smart_list_template_workspaces_workspaceId_workspaces_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.global_smart_list_template_workspaces
    ADD CONSTRAINT "global_smart_list_template_workspaces_workspaceId_workspaces_id" FOREIGN KEY ("workspaceId") REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: invites invites_invitedBy_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invites
    ADD CONSTRAINT "invites_invitedBy_users_id_fk" FOREIGN KEY ("invitedBy") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: invites invites_roleId_roles_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invites
    ADD CONSTRAINT "invites_roleId_roles_id_fk" FOREIGN KEY ("roleId") REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: invites invites_workspaceId_workspaces_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invites
    ADD CONSTRAINT "invites_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: key_metric_instances key_metric_instances_createdBy_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.key_metric_instances
    ADD CONSTRAINT "key_metric_instances_createdBy_users_id_fk" FOREIGN KEY ("createdBy") REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: key_metric_instances key_metric_instances_keyMetricTemplateId_key_metric_templates_i; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.key_metric_instances
    ADD CONSTRAINT "key_metric_instances_keyMetricTemplateId_key_metric_templates_i" FOREIGN KEY ("keyMetricTemplateId") REFERENCES public.key_metric_templates(id) ON DELETE CASCADE;


--
-- Name: key_metric_instances key_metric_instances_parentId_key_metric_instances_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.key_metric_instances
    ADD CONSTRAINT "key_metric_instances_parentId_key_metric_instances_id_fk" FOREIGN KEY ("parentId") REFERENCES public.key_metric_instances(id) ON DELETE CASCADE;


--
-- Name: key_metric_instances key_metric_instances_partnerId_partners_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.key_metric_instances
    ADD CONSTRAINT "key_metric_instances_partnerId_partners_id_fk" FOREIGN KEY ("partnerId") REFERENCES public.partners(id) ON DELETE CASCADE;


--
-- Name: key_metric_instances key_metric_instances_tagId_key_metric_tags_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.key_metric_instances
    ADD CONSTRAINT "key_metric_instances_tagId_key_metric_tags_id_fk" FOREIGN KEY ("tagId") REFERENCES public.key_metric_tags(id) ON DELETE SET NULL;


--
-- Name: key_metric_instances key_metric_instances_updatedBy_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.key_metric_instances
    ADD CONSTRAINT "key_metric_instances_updatedBy_users_id_fk" FOREIGN KEY ("updatedBy") REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: key_metric_instances key_metric_instances_workspaceId_workspaces_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.key_metric_instances
    ADD CONSTRAINT "key_metric_instances_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: key_metric_milestones key_metric_milestones_keyMetricInstanceId_key_metric_instances_; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.key_metric_milestones
    ADD CONSTRAINT "key_metric_milestones_keyMetricInstanceId_key_metric_instances_" FOREIGN KEY ("keyMetricInstanceId") REFERENCES public.key_metric_instances(id) ON DELETE CASCADE;


--
-- Name: key_metric_realized_history key_metric_realized_history_keyMetricInstanceId_key_metric_inst; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.key_metric_realized_history
    ADD CONSTRAINT "key_metric_realized_history_keyMetricInstanceId_key_metric_inst" FOREIGN KEY ("keyMetricInstanceId") REFERENCES public.key_metric_instances(id) ON DELETE CASCADE;


--
-- Name: key_metric_realized_history key_metric_realized_history_milestoneId_key_metric_milestones_i; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.key_metric_realized_history
    ADD CONSTRAINT "key_metric_realized_history_milestoneId_key_metric_milestones_i" FOREIGN KEY ("milestoneId") REFERENCES public.key_metric_milestones(id) ON DELETE CASCADE;


--
-- Name: key_metric_realized_history key_metric_realized_history_userId_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.key_metric_realized_history
    ADD CONSTRAINT "key_metric_realized_history_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: key_metric_tag_categories key_metric_tag_categories_createdBy_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.key_metric_tag_categories
    ADD CONSTRAINT "key_metric_tag_categories_createdBy_users_id_fk" FOREIGN KEY ("createdBy") REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: key_metric_tag_categories key_metric_tag_categories_updatedBy_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.key_metric_tag_categories
    ADD CONSTRAINT "key_metric_tag_categories_updatedBy_users_id_fk" FOREIGN KEY ("updatedBy") REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: key_metric_tag_categories key_metric_tag_categories_workspaceId_workspaces_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.key_metric_tag_categories
    ADD CONSTRAINT "key_metric_tag_categories_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: key_metric_tags key_metric_tags_categoryId_key_metric_tag_categories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.key_metric_tags
    ADD CONSTRAINT "key_metric_tags_categoryId_key_metric_tag_categories_id_fk" FOREIGN KEY ("categoryId") REFERENCES public.key_metric_tag_categories(id) ON DELETE SET NULL;


--
-- Name: key_metric_tags key_metric_tags_createdBy_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.key_metric_tags
    ADD CONSTRAINT "key_metric_tags_createdBy_users_id_fk" FOREIGN KEY ("createdBy") REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: key_metric_tags key_metric_tags_updatedBy_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.key_metric_tags
    ADD CONSTRAINT "key_metric_tags_updatedBy_users_id_fk" FOREIGN KEY ("updatedBy") REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: key_metric_tags key_metric_tags_workspaceId_workspaces_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.key_metric_tags
    ADD CONSTRAINT "key_metric_tags_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: key_metric_templates key_metric_templates_createdBy_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.key_metric_templates
    ADD CONSTRAINT "key_metric_templates_createdBy_users_id_fk" FOREIGN KEY ("createdBy") REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: key_metric_templates key_metric_templates_parentId_key_metric_templates_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.key_metric_templates
    ADD CONSTRAINT "key_metric_templates_parentId_key_metric_templates_id_fk" FOREIGN KEY ("parentId") REFERENCES public.key_metric_templates(id) ON DELETE CASCADE;


--
-- Name: key_metric_templates key_metric_templates_tagId_key_metric_tags_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.key_metric_templates
    ADD CONSTRAINT "key_metric_templates_tagId_key_metric_tags_id_fk" FOREIGN KEY ("tagId") REFERENCES public.key_metric_tags(id) ON DELETE SET NULL;


--
-- Name: key_metric_templates key_metric_templates_updatedBy_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.key_metric_templates
    ADD CONSTRAINT "key_metric_templates_updatedBy_users_id_fk" FOREIGN KEY ("updatedBy") REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: key_metric_templates key_metric_templates_workspaceId_workspaces_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.key_metric_templates
    ADD CONSTRAINT "key_metric_templates_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: leads leads_createdBy_members_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT "leads_createdBy_members_id_fk" FOREIGN KEY ("createdBy") REFERENCES public.members(id) ON DELETE SET NULL;


--
-- Name: leads leads_ownerId_members_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT "leads_ownerId_members_id_fk" FOREIGN KEY ("ownerId") REFERENCES public.members(id) ON DELETE SET NULL;


--
-- Name: leads leads_updatedBy_members_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT "leads_updatedBy_members_id_fk" FOREIGN KEY ("updatedBy") REFERENCES public.members(id) ON DELETE SET NULL;


--
-- Name: leads leads_workspaceId_workspaces_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT "leads_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: members members_roleId_roles_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.members
    ADD CONSTRAINT "members_roleId_roles_id_fk" FOREIGN KEY ("roleId") REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: members members_userId_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.members
    ADD CONSTRAINT "members_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: members members_workspaceId_workspaces_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.members
    ADD CONSTRAINT "members_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: opportunities opportunities_createdBy_members_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunities
    ADD CONSTRAINT "opportunities_createdBy_members_id_fk" FOREIGN KEY ("createdBy") REFERENCES public.members(id) ON DELETE SET NULL;


--
-- Name: opportunities opportunities_customerId_customers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunities
    ADD CONSTRAINT "opportunities_customerId_customers_id_fk" FOREIGN KEY ("customerId") REFERENCES public.customers(id) ON DELETE SET NULL;


--
-- Name: opportunities opportunities_ownerId_members_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunities
    ADD CONSTRAINT "opportunities_ownerId_members_id_fk" FOREIGN KEY ("ownerId") REFERENCES public.members(id) ON DELETE SET NULL;


--
-- Name: opportunities_team opportunities_team_memberId_members_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunities_team
    ADD CONSTRAINT "opportunities_team_memberId_members_id_fk" FOREIGN KEY ("memberId") REFERENCES public.members(id) ON DELETE CASCADE;


--
-- Name: opportunities_team opportunities_team_opportunityId_opportunities_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunities_team
    ADD CONSTRAINT "opportunities_team_opportunityId_opportunities_id_fk" FOREIGN KEY ("opportunityId") REFERENCES public.opportunities(id) ON DELETE CASCADE;


--
-- Name: opportunities opportunities_updatedBy_members_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunities
    ADD CONSTRAINT "opportunities_updatedBy_members_id_fk" FOREIGN KEY ("updatedBy") REFERENCES public.members(id) ON DELETE SET NULL;


--
-- Name: opportunities opportunities_workspaceId_workspaces_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunities
    ADD CONSTRAINT "opportunities_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: opportunity_comments opportunity_comments_memberId_members_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunity_comments
    ADD CONSTRAINT "opportunity_comments_memberId_members_id_fk" FOREIGN KEY ("memberId") REFERENCES public.members(id) ON DELETE SET NULL;


--
-- Name: opportunity_comments opportunity_comments_opportunityId_opportunities_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunity_comments
    ADD CONSTRAINT "opportunity_comments_opportunityId_opportunities_id_fk" FOREIGN KEY ("opportunityId") REFERENCES public.opportunities(id) ON DELETE CASCADE;


--
-- Name: opportunity_comments opportunity_comments_spaceUserId_anonymous_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunity_comments
    ADD CONSTRAINT "opportunity_comments_spaceUserId_anonymous_users_id_fk" FOREIGN KEY ("spaceUserId") REFERENCES public.anonymous_users(id) ON DELETE SET NULL;


--
-- Name: opportunity_comments opportunity_comments_workspaceId_workspaces_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunity_comments
    ADD CONSTRAINT "opportunity_comments_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: partner_customers partner_customers_customerId_customers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_customers
    ADD CONSTRAINT "partner_customers_customerId_customers_id_fk" FOREIGN KEY ("customerId") REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: partner_customers partner_customers_partnerId_partners_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_customers
    ADD CONSTRAINT "partner_customers_partnerId_partners_id_fk" FOREIGN KEY ("partnerId") REFERENCES public.partners(id) ON DELETE CASCADE;


--
-- Name: partner_opportunities partner_opportunities_opportunityId_opportunities_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_opportunities
    ADD CONSTRAINT "partner_opportunities_opportunityId_opportunities_id_fk" FOREIGN KEY ("opportunityId") REFERENCES public.opportunities(id) ON DELETE CASCADE;


--
-- Name: partner_opportunities partner_opportunities_partnerId_partners_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_opportunities
    ADD CONSTRAINT "partner_opportunities_partnerId_partners_id_fk" FOREIGN KEY ("partnerId") REFERENCES public.partners(id) ON DELETE CASCADE;


--
-- Name: partner_team partner_team_memberId_members_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_team
    ADD CONSTRAINT "partner_team_memberId_members_id_fk" FOREIGN KEY ("memberId") REFERENCES public.members(id) ON DELETE CASCADE;


--
-- Name: partner_team partner_team_partnerId_partners_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_team
    ADD CONSTRAINT "partner_team_partnerId_partners_id_fk" FOREIGN KEY ("partnerId") REFERENCES public.partners(id) ON DELETE CASCADE;


--
-- Name: partners partners_createdBy_members_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partners
    ADD CONSTRAINT "partners_createdBy_members_id_fk" FOREIGN KEY ("createdBy") REFERENCES public.members(id) ON DELETE SET NULL;


--
-- Name: partners partners_ownerId_members_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partners
    ADD CONSTRAINT "partners_ownerId_members_id_fk" FOREIGN KEY ("ownerId") REFERENCES public.members(id) ON DELETE SET NULL;


--
-- Name: partners partners_updatedBy_members_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partners
    ADD CONSTRAINT "partners_updatedBy_members_id_fk" FOREIGN KEY ("updatedBy") REFERENCES public.members(id) ON DELETE SET NULL;


--
-- Name: partners partners_workspaceId_workspaces_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partners
    ADD CONSTRAINT "partners_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: postal_codes postal_codes_cityId_cities_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.postal_codes
    ADD CONSTRAINT "postal_codes_cityId_cities_id_fk" FOREIGN KEY ("cityId") REFERENCES public.cities(id) ON DELETE SET NULL;


--
-- Name: postal_codes postal_codes_countryId_countries_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.postal_codes
    ADD CONSTRAINT "postal_codes_countryId_countries_id_fk" FOREIGN KEY ("countryId") REFERENCES public.countries(id) ON DELETE RESTRICT;


--
-- Name: product_partners product_partners_partnerId_partners_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_partners
    ADD CONSTRAINT "product_partners_partnerId_partners_id_fk" FOREIGN KEY ("partnerId") REFERENCES public.partners(id) ON DELETE CASCADE;


--
-- Name: product_partners product_partners_productId_products_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_partners
    ADD CONSTRAINT "product_partners_productId_products_id_fk" FOREIGN KEY ("productId") REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: product_risk_objects product_risk_objects_productId_products_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_risk_objects
    ADD CONSTRAINT "product_risk_objects_productId_products_id_fk" FOREIGN KEY ("productId") REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: product_risk_objects product_risk_objects_riskObjectId_risk_objects_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_risk_objects
    ADD CONSTRAINT "product_risk_objects_riskObjectId_risk_objects_id_fk" FOREIGN KEY ("riskObjectId") REFERENCES public.risk_objects(id) ON DELETE CASCADE;


--
-- Name: product_templates product_templates_categoryId_categories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_templates
    ADD CONSTRAINT "product_templates_categoryId_categories_id_fk" FOREIGN KEY ("categoryId") REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- Name: product_templates product_templates_createdBy_members_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_templates
    ADD CONSTRAINT "product_templates_createdBy_members_id_fk" FOREIGN KEY ("createdBy") REFERENCES public.members(id) ON DELETE SET NULL;


--
-- Name: product_templates product_templates_updatedBy_members_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_templates
    ADD CONSTRAINT "product_templates_updatedBy_members_id_fk" FOREIGN KEY ("updatedBy") REFERENCES public.members(id) ON DELETE SET NULL;


--
-- Name: product_templates product_templates_workspaceId_workspaces_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_templates
    ADD CONSTRAINT "product_templates_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: products products_createdBy_members_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "products_createdBy_members_id_fk" FOREIGN KEY ("createdBy") REFERENCES public.members(id) ON DELETE SET NULL;


--
-- Name: products products_customerId_customers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "products_customerId_customers_id_fk" FOREIGN KEY ("customerId") REFERENCES public.customers(id) ON DELETE SET NULL;


--
-- Name: products products_opportunityId_opportunities_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "products_opportunityId_opportunities_id_fk" FOREIGN KEY ("opportunityId") REFERENCES public.opportunities(id) ON DELETE SET NULL;


--
-- Name: products products_productCategoryId_categories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "products_productCategoryId_categories_id_fk" FOREIGN KEY ("productCategoryId") REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- Name: products products_productTemplateId_product_templates_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "products_productTemplateId_product_templates_id_fk" FOREIGN KEY ("productTemplateId") REFERENCES public.product_templates(id) ON DELETE SET NULL;


--
-- Name: products products_updatedBy_members_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "products_updatedBy_members_id_fk" FOREIGN KEY ("updatedBy") REFERENCES public.members(id) ON DELETE SET NULL;


--
-- Name: products products_workspaceId_workspaces_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "products_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: risk_object_coverages risk_object_coverages_coverageId_coverages_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.risk_object_coverages
    ADD CONSTRAINT "risk_object_coverages_coverageId_coverages_id_fk" FOREIGN KEY ("coverageId") REFERENCES public.coverages(id) ON DELETE CASCADE;


--
-- Name: risk_object_coverages risk_object_coverages_riskObjectId_risk_objects_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.risk_object_coverages
    ADD CONSTRAINT "risk_object_coverages_riskObjectId_risk_objects_id_fk" FOREIGN KEY ("riskObjectId") REFERENCES public.risk_objects(id) ON DELETE CASCADE;


--
-- Name: risk_objects risk_objects_createdBy_members_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.risk_objects
    ADD CONSTRAINT "risk_objects_createdBy_members_id_fk" FOREIGN KEY ("createdBy") REFERENCES public.members(id) ON DELETE SET NULL;


--
-- Name: risk_objects risk_objects_updatedBy_members_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.risk_objects
    ADD CONSTRAINT "risk_objects_updatedBy_members_id_fk" FOREIGN KEY ("updatedBy") REFERENCES public.members(id) ON DELETE SET NULL;


--
-- Name: risk_objects risk_objects_workspaceId_workspaces_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.risk_objects
    ADD CONSTRAINT "risk_objects_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: roles roles_workspaceId_workspaces_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT "roles_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: shares shares_fromWorkspaceId_workspaces_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shares
    ADD CONSTRAINT "shares_fromWorkspaceId_workspaces_id_fk" FOREIGN KEY ("fromWorkspaceId") REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: shares shares_shareResourceId_shares_resources_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shares
    ADD CONSTRAINT "shares_shareResourceId_shares_resources_id_fk" FOREIGN KEY ("shareResourceId") REFERENCES public.shares_resources(id) ON DELETE CASCADE;


--
-- Name: shares shares_sharedById_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shares
    ADD CONSTRAINT "shares_sharedById_users_id_fk" FOREIGN KEY ("sharedById") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: shares shares_sharedWithId_anonymous_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shares
    ADD CONSTRAINT "shares_sharedWithId_anonymous_users_id_fk" FOREIGN KEY ("sharedWithId") REFERENCES public.anonymous_users(id) ON DELETE CASCADE;


--
-- Name: smart_list_templates smart_list_templates_workspaceId_workspaces_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.smart_list_templates
    ADD CONSTRAINT "smart_list_templates_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: smart_lists smart_lists_globalSmartListTemplateId_global_smart_list_templat; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.smart_lists
    ADD CONSTRAINT "smart_lists_globalSmartListTemplateId_global_smart_list_templat" FOREIGN KEY ("globalSmartListTemplateId") REFERENCES public.global_smart_list_templates(id) ON DELETE CASCADE;


--
-- Name: smart_lists smart_lists_smartListTemplateId_smart_list_templates_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.smart_lists
    ADD CONSTRAINT "smart_lists_smartListTemplateId_smart_list_templates_id_fk" FOREIGN KEY ("smartListTemplateId") REFERENCES public.smart_list_templates(id) ON DELETE CASCADE;


--
-- Name: smart_lists smart_lists_workspaceId_workspaces_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.smart_lists
    ADD CONSTRAINT "smart_lists_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: tags tags_workspaceId_workspaces_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT "tags_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: user_workspace_settings user_workspace_settings_userId_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_workspace_settings
    ADD CONSTRAINT "user_workspace_settings_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_workspace_settings user_workspace_settings_workspaceId_workspaces_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_workspace_settings
    ADD CONSTRAINT "user_workspace_settings_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: workspace_entity_list_configurations workspace_entity_list_configurations_workspaceId_workspaces_id_; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workspace_entity_list_configurations
    ADD CONSTRAINT "workspace_entity_list_configurations_workspaceId_workspaces_id_" FOREIGN KEY ("workspaceId") REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: activity_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: activity_logs activity_logs_isolation_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY activity_logs_isolation_policy ON public.activity_logs USING (((current_setting('app.current_workspace_id'::text, true) IS NULL) OR ("workspaceId" = current_setting('app.current_workspace_id'::text, true))));


--
-- Name: addresses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

--
-- Name: addresses addresses_isolation_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY addresses_isolation_policy ON public.addresses USING (((current_setting('app.current_workspace_id'::text, true) IS NULL) OR ("workspaceId" = current_setting('app.current_workspace_id'::text, true))));


--
-- Name: attributes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.attributes ENABLE ROW LEVEL SECURITY;

--
-- Name: attributes attributes_isolation_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY attributes_isolation_policy ON public.attributes USING (((current_setting('app.current_workspace_id'::text, true) IS NULL) OR ("workspaceId" = current_setting('app.current_workspace_id'::text, true))));


--
-- Name: campaign_domains; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.campaign_domains ENABLE ROW LEVEL SECURITY;

--
-- Name: campaign_domains campaign_domains_isolation_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY campaign_domains_isolation_policy ON public.campaign_domains USING (((current_setting('app.current_workspace_id'::text, true) IS NULL) OR ("workspaceId" = current_setting('app.current_workspace_id'::text, true))));


--
-- Name: campaign_sender_emails; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.campaign_sender_emails ENABLE ROW LEVEL SECURITY;

--
-- Name: campaign_sender_emails campaign_sender_emails_isolation_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY campaign_sender_emails_isolation_policy ON public.campaign_sender_emails USING (((current_setting('app.current_workspace_id'::text, true) IS NULL) OR ("workspaceId" = current_setting('app.current_workspace_id'::text, true))));


--
-- Name: campaign_templates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.campaign_templates ENABLE ROW LEVEL SECURITY;

--
-- Name: campaign_templates campaign_templates_isolation_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY campaign_templates_isolation_policy ON public.campaign_templates USING (((current_setting('app.current_workspace_id'::text, true) IS NULL) OR ("workspaceId" = current_setting('app.current_workspace_id'::text, true))));


--
-- Name: campaigns; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

--
-- Name: campaigns campaigns_isolation_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY campaigns_isolation_policy ON public.campaigns USING (((current_setting('app.current_workspace_id'::text, true) IS NULL) OR ("workspaceId" = current_setting('app.current_workspace_id'::text, true))));


--
-- Name: categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

--
-- Name: categories categories_isolation_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY categories_isolation_policy ON public.categories USING (((current_setting('app.current_workspace_id'::text, true) IS NULL) OR ("workspaceId" = current_setting('app.current_workspace_id'::text, true))));


--
-- Name: contacts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

--
-- Name: contacts contacts_isolation_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY contacts_isolation_policy ON public.contacts USING (((current_setting('app.current_workspace_id'::text, true) IS NULL) OR ("workspaceId" = current_setting('app.current_workspace_id'::text, true))));


--
-- Name: coverages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.coverages ENABLE ROW LEVEL SECURITY;

--
-- Name: coverages coverages_isolation_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY coverages_isolation_policy ON public.coverages USING (((current_setting('app.current_workspace_id'::text, true) IS NULL) OR ("workspaceId" = current_setting('app.current_workspace_id'::text, true))));


--
-- Name: customer_relationships; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.customer_relationships ENABLE ROW LEVEL SECURITY;

--
-- Name: customer_relationships customer_relationships_isolation_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY customer_relationships_isolation_policy ON public.customer_relationships USING (((current_setting('app.current_workspace_id'::text, true) IS NULL) OR ("workspaceId" = current_setting('app.current_workspace_id'::text, true))));


--
-- Name: customers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

--
-- Name: customers customers_isolation_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY customers_isolation_policy ON public.customers USING (((current_setting('app.current_workspace_id'::text, true) IS NULL) OR ("workspaceId" = current_setting('app.current_workspace_id'::text, true))));


--
-- Name: data_import_templates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.data_import_templates ENABLE ROW LEVEL SECURITY;

--
-- Name: data_import_templates data_import_templates_isolation_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY data_import_templates_isolation_policy ON public.data_import_templates USING (((current_setting('app.current_workspace_id'::text, true) IS NULL) OR ("workspaceId" = current_setting('app.current_workspace_id'::text, true))));


--
-- Name: entity_list_configurations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.entity_list_configurations ENABLE ROW LEVEL SECURITY;

--
-- Name: entity_list_configurations entity_list_configurations_isolation_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY entity_list_configurations_isolation_policy ON public.entity_list_configurations USING (((current_setting('app.current_workspace_id'::text, true) IS NULL) OR ("workspaceId" = current_setting('app.current_workspace_id'::text, true))));


--
-- Name: entity_lists; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.entity_lists ENABLE ROW LEVEL SECURITY;

--
-- Name: entity_lists entity_lists_isolation_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY entity_lists_isolation_policy ON public.entity_lists USING (((current_setting('app.current_workspace_id'::text, true) IS NULL) OR ("workspaceId" = current_setting('app.current_workspace_id'::text, true))));


--
-- Name: entity_views; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.entity_views ENABLE ROW LEVEL SECURITY;

--
-- Name: entity_views entity_views_isolation_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY entity_views_isolation_policy ON public.entity_views USING (((current_setting('app.current_workspace_id'::text, true) IS NULL) OR ("workspaceId" = current_setting('app.current_workspace_id'::text, true))));


--
-- Name: invites; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

--
-- Name: invites invites_isolation_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY invites_isolation_policy ON public.invites USING (((current_setting('app.current_workspace_id'::text, true) IS NULL) OR ("workspaceId" = current_setting('app.current_workspace_id'::text, true))));


--
-- Name: key_metric_instances; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.key_metric_instances ENABLE ROW LEVEL SECURITY;

--
-- Name: key_metric_instances key_metric_instances_isolation_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY key_metric_instances_isolation_policy ON public.key_metric_instances USING (((current_setting('app.current_workspace_id'::text, true) IS NULL) OR ("workspaceId" = current_setting('app.current_workspace_id'::text, true))));


--
-- Name: key_metric_tag_categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.key_metric_tag_categories ENABLE ROW LEVEL SECURITY;

--
-- Name: key_metric_tag_categories key_metric_tag_categories_isolation_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY key_metric_tag_categories_isolation_policy ON public.key_metric_tag_categories USING (((current_setting('app.current_workspace_id'::text, true) IS NULL) OR ("workspaceId" = current_setting('app.current_workspace_id'::text, true))));


--
-- Name: key_metric_tags; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.key_metric_tags ENABLE ROW LEVEL SECURITY;

--
-- Name: key_metric_tags key_metric_tags_isolation_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY key_metric_tags_isolation_policy ON public.key_metric_tags USING (((current_setting('app.current_workspace_id'::text, true) IS NULL) OR ("workspaceId" = current_setting('app.current_workspace_id'::text, true))));


--
-- Name: key_metric_templates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.key_metric_templates ENABLE ROW LEVEL SECURITY;

--
-- Name: key_metric_templates key_metric_templates_isolation_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY key_metric_templates_isolation_policy ON public.key_metric_templates USING (((current_setting('app.current_workspace_id'::text, true) IS NULL) OR ("workspaceId" = current_setting('app.current_workspace_id'::text, true))));


--
-- Name: members; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

--
-- Name: members members_isolation_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY members_isolation_policy ON public.members USING (((current_setting('app.current_workspace_id'::text, true) IS NULL) OR ("workspaceId" = current_setting('app.current_workspace_id'::text, true))));


--
-- Name: opportunities; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

--
-- Name: opportunities opportunities_isolation_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY opportunities_isolation_policy ON public.opportunities USING (((current_setting('app.current_workspace_id'::text, true) IS NULL) OR ("workspaceId" = current_setting('app.current_workspace_id'::text, true))));


--
-- Name: opportunity_comments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.opportunity_comments ENABLE ROW LEVEL SECURITY;

--
-- Name: opportunity_comments opportunity_comments_isolation_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY opportunity_comments_isolation_policy ON public.opportunity_comments USING (((current_setting('app.current_workspace_id'::text, true) IS NULL) OR ("workspaceId" = current_setting('app.current_workspace_id'::text, true))));


--
-- Name: partners; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

--
-- Name: partners partners_isolation_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY partners_isolation_policy ON public.partners USING (((current_setting('app.current_workspace_id'::text, true) IS NULL) OR ("workspaceId" = current_setting('app.current_workspace_id'::text, true))));


--
-- Name: product_templates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.product_templates ENABLE ROW LEVEL SECURITY;

--
-- Name: product_templates product_templates_isolation_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY product_templates_isolation_policy ON public.product_templates USING (((current_setting('app.current_workspace_id'::text, true) IS NULL) OR ("workspaceId" = current_setting('app.current_workspace_id'::text, true))));


--
-- Name: products; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

--
-- Name: products products_isolation_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY products_isolation_policy ON public.products USING (((current_setting('app.current_workspace_id'::text, true) IS NULL) OR ("workspaceId" = current_setting('app.current_workspace_id'::text, true))));


--
-- Name: risk_objects; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.risk_objects ENABLE ROW LEVEL SECURITY;

--
-- Name: risk_objects risk_objects_isolation_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY risk_objects_isolation_policy ON public.risk_objects USING (((current_setting('app.current_workspace_id'::text, true) IS NULL) OR ("workspaceId" = current_setting('app.current_workspace_id'::text, true))));


--
-- Name: roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

--
-- Name: roles roles_isolation_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY roles_isolation_policy ON public.roles USING (((current_setting('app.current_workspace_id'::text, true) IS NULL) OR ("workspaceId" = current_setting('app.current_workspace_id'::text, true))));


--
-- Name: smart_list_templates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.smart_list_templates ENABLE ROW LEVEL SECURITY;

--
-- Name: smart_list_templates smart_list_templates_isolation_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY smart_list_templates_isolation_policy ON public.smart_list_templates USING (((current_setting('app.current_workspace_id'::text, true) IS NULL) OR ("workspaceId" = current_setting('app.current_workspace_id'::text, true))));


--
-- Name: smart_lists; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.smart_lists ENABLE ROW LEVEL SECURITY;

--
-- Name: smart_lists smart_lists_isolation_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY smart_lists_isolation_policy ON public.smart_lists USING (((current_setting('app.current_workspace_id'::text, true) IS NULL) OR ("workspaceId" = current_setting('app.current_workspace_id'::text, true))));


--
-- Name: tags; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

--
-- Name: tags tags_isolation_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tags_isolation_policy ON public.tags USING (((current_setting('app.current_workspace_id'::text, true) IS NULL) OR ("workspaceId" = current_setting('app.current_workspace_id'::text, true))));


--
-- Name: workspaces; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

--
-- Name: workspaces workspaces_isolation_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY workspaces_isolation_policy ON public.workspaces USING (((current_setting('app.current_workspace_id'::text, true) IS NULL) OR (id = current_setting('app.current_workspace_id'::text, true))));


--
-- Name: _private_job_queues; Type: ROW SECURITY; Schema: worker; Owner: -
--

ALTER TABLE worker._private_job_queues ENABLE ROW LEVEL SECURITY;

--
-- Name: _private_jobs; Type: ROW SECURITY; Schema: worker; Owner: -
--

ALTER TABLE worker._private_jobs ENABLE ROW LEVEL SECURITY;

--
-- Name: _private_known_crontabs; Type: ROW SECURITY; Schema: worker; Owner: -
--

ALTER TABLE worker._private_known_crontabs ENABLE ROW LEVEL SECURITY;

--
-- Name: _private_tasks; Type: ROW SECURITY; Schema: worker; Owner: -
--

ALTER TABLE worker._private_tasks ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

