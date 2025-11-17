CREATE TABLE "public"."agent_config" ( 
  "id" UUID NOT NULL DEFAULT uuid_generate_v4() ,
  "config_key" VARCHAR(255) NOT NULL,
  "config_value" JSONB NOT NULL,
  "description" TEXT NULL,
  "is_active" BOOLEAN NULL DEFAULT true ,
  "created_at" TIMESTAMP WITH TIME ZONE NULL DEFAULT CURRENT_TIMESTAMP ,
  "updated_at" TIMESTAMP WITH TIME ZONE NULL DEFAULT CURRENT_TIMESTAMP ,
  CONSTRAINT "agent_config_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "agent_config_config_key_key" UNIQUE ("config_key")
);
CREATE TABLE "public"."api_keys" ( 
  "id" UUID NOT NULL DEFAULT uuid_generate_v4() ,
  "user_id" UUID NULL,
  "key_hash" VARCHAR(255) NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT NULL,
  "permissions" JSONB NULL DEFAULT '["read"]'::jsonb ,
  "last_used_at" TIMESTAMP WITH TIME ZONE NULL,
  "expires_at" TIMESTAMP WITH TIME ZONE NULL,
  "is_active" BOOLEAN NULL DEFAULT true ,
  "created_at" TIMESTAMP WITH TIME ZONE NULL DEFAULT CURRENT_TIMESTAMP ,
  CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "api_keys_key_hash_key" UNIQUE ("key_hash")
);
CREATE TABLE "public"."chat_messages" ( 
  "id" SERIAL,
  "instance" TEXT NOT NULL,
  "remote_jid" TEXT NOT NULL,
  "message_id" TEXT NULL,
  "direction" TEXT NOT NULL,
  "text" TEXT NULL,
  "meta" JSONB NULL,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now() ,
  CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "public"."contacts" ( 
  "id" SERIAL,
  "instance" TEXT NOT NULL,
  "remote_jid" TEXT NOT NULL,
  "name" TEXT NULL,
  "first_seen_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now() ,
  "last_seen_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now() ,
  CONSTRAINT "contacts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "contacts_unique" UNIQUE ("instance", "remote_jid")
);
CREATE TABLE "public"."conversation_messages" ( 
  "id" UUID NOT NULL DEFAULT uuid_generate_v4() ,
  "conversation_id" UUID NULL,
  "role" VARCHAR(50) NOT NULL,
  "content" TEXT NOT NULL,
  "system_id" UUID NULL,
  "metadata" JSONB NULL,
  "created_at" TIMESTAMP WITH TIME ZONE NULL DEFAULT CURRENT_TIMESTAMP ,
  CONSTRAINT "conversation_messages_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "public"."conversation_state" ( 
  "id" SERIAL,
  "instance" TEXT NOT NULL,
  "remote_jid" TEXT NOT NULL,
  "state" TEXT NOT NULL,
  "payload" JSONB NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now() ,
  CONSTRAINT "conversation_state_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "conv_state_unique" UNIQUE ("instance", "remote_jid")
);
CREATE TABLE "public"."conversations" ( 
  "id" UUID NOT NULL DEFAULT uuid_generate_v4() ,
  "user_id" UUID NULL,
  "title" VARCHAR(500) NULL,
  "is_active" BOOLEAN NULL DEFAULT true ,
  "last_message_at" TIMESTAMP WITH TIME ZONE NULL DEFAULT CURRENT_TIMESTAMP ,
  "created_at" TIMESTAMP WITH TIME ZONE NULL DEFAULT CURRENT_TIMESTAMP ,
  "updated_at" TIMESTAMP WITH TIME ZONE NULL DEFAULT CURRENT_TIMESTAMP ,
  CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "public"."favorites" ( 
  "id" UUID NOT NULL DEFAULT uuid_generate_v4() ,
  "user_id" UUID NULL,
  "entity_type" VARCHAR(50) NOT NULL,
  "entity_id" UUID NOT NULL,
  "notes" TEXT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE NULL DEFAULT CURRENT_TIMESTAMP ,
  CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "public"."notifications" ( 
  "id" UUID NOT NULL DEFAULT uuid_generate_v4() ,
  "user_id" UUID NULL,
  "title" VARCHAR(255) NOT NULL,
  "message" TEXT NOT NULL,
  "type" VARCHAR(50) NULL DEFAULT 'info'::character varying ,
  "link" TEXT NULL,
  "is_read" BOOLEAN NULL DEFAULT false ,
  "created_at" TIMESTAMP WITH TIME ZONE NULL DEFAULT CURRENT_TIMESTAMP ,
  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "public"."queries" ( 
  "id" UUID NOT NULL DEFAULT uuid_generate_v4() ,
  "user_id" UUID NULL,
  "question" TEXT NOT NULL,
  "system_id" UUID NULL,
  "system_name" VARCHAR(255) NULL,
  "response" TEXT NULL,
  "response_metadata" JSONB NULL,
  "status" VARCHAR(50) NULL DEFAULT 'pending'::character varying ,
  "error_message" TEXT NULL,
  "execution_time_ms" INTEGER NULL,
  "tokens_used" INTEGER NULL,
  "is_favorite" BOOLEAN NULL DEFAULT false ,
  "created_at" TIMESTAMP WITH TIME ZONE NULL DEFAULT CURRENT_TIMESTAMP ,
  "completed_at" TIMESTAMP WITH TIME ZONE NULL,
  CONSTRAINT "queries_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "public"."query_history" ( 
  "id" UUID NOT NULL DEFAULT uuid_generate_v4() ,
  "query_id" UUID NULL,
  "user_id" UUID NULL,
  "action" VARCHAR(100) NOT NULL,
  "metadata" JSONB NULL,
  "created_at" TIMESTAMP WITH TIME ZONE NULL DEFAULT CURRENT_TIMESTAMP ,
  CONSTRAINT "query_history_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "public"."system_documentation" ( 
  "id" UUID NOT NULL DEFAULT uuid_generate_v4() ,
  "system_id" UUID NULL,
  "title" VARCHAR(500) NOT NULL,
  "content" TEXT NOT NULL,
  "doc_type" VARCHAR(100) NULL DEFAULT 'guide'::character varying ,
  "order_index" INTEGER NULL DEFAULT 0 ,
  "is_published" BOOLEAN NULL DEFAULT true ,
  "author_id" UUID NULL,
  "created_at" TIMESTAMP WITH TIME ZONE NULL DEFAULT CURRENT_TIMESTAMP ,
  "updated_at" TIMESTAMP WITH TIME ZONE NULL DEFAULT CURRENT_TIMESTAMP ,
  CONSTRAINT "system_documentation_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "public"."system_logs" ( 
  "id" UUID NOT NULL DEFAULT uuid_generate_v4() ,
  "system_id" UUID NULL,
  "user_id" UUID NULL,
  "action" VARCHAR(100) NOT NULL,
  "details" TEXT NULL,
  "metadata" JSONB NULL,
  "ip_address" INET NULL,
  "user_agent" TEXT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE NULL DEFAULT CURRENT_TIMESTAMP ,
  CONSTRAINT "system_logs_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "public"."systems" ( 
  "id" UUID NOT NULL DEFAULT uuid_generate_v4() ,
  "name" VARCHAR(255) NOT NULL,
  "slug" VARCHAR(255) NOT NULL,
  "category" VARCHAR(100) NOT NULL,
  "status" VARCHAR(50) NULL DEFAULT 'online'::character varying ,
  "description" TEXT NULL,
  "icon" VARCHAR(50) NULL,
  "version" VARCHAR(50) NULL,
  "database_connection" JSONB NULL,
  "api_endpoint" TEXT NULL,
  "documentation_url" TEXT NULL,
  "contact_email" VARCHAR(255) NULL,
  "order_index" INTEGER NULL DEFAULT 0 ,
  "is_active" BOOLEAN NULL DEFAULT true ,
  "created_at" TIMESTAMP WITH TIME ZONE NULL DEFAULT CURRENT_TIMESTAMP ,
  "updated_at" TIMESTAMP WITH TIME ZONE NULL DEFAULT CURRENT_TIMESTAMP ,
  CONSTRAINT "systems_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "systems_slug_key" UNIQUE ("slug")
);
CREATE TABLE "public"."user_calendars" ( 
  "id" SERIAL,
  "instance" TEXT NOT NULL,
  "remote_jid" TEXT NOT NULL,
  "google_calendar_email" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true ,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now() ,
  CONSTRAINT "user_calendars_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "public"."users" ( 
  "id" UUID NOT NULL DEFAULT uuid_generate_v4() ,
  "email" VARCHAR(255) NOT NULL,
  "password_hash" VARCHAR(255) NOT NULL,
  "full_name" VARCHAR(255) NOT NULL,
  "role" VARCHAR(50) NULL DEFAULT 'user'::character varying ,
  "avatar_url" TEXT NULL,
  "is_active" BOOLEAN NULL DEFAULT true ,
  "last_login" TIMESTAMP WITH TIME ZONE NULL,
  "created_at" TIMESTAMP WITH TIME ZONE NULL DEFAULT CURRENT_TIMESTAMP ,
  "updated_at" TIMESTAMP WITH TIME ZONE NULL DEFAULT CURRENT_TIMESTAMP ,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "users_email_key" UNIQUE ("email")
);
ALTER TABLE "public"."api_keys" ADD CONSTRAINT "api_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "public"."conversation_messages" ADD CONSTRAINT "conversation_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "public"."conversation_messages" ADD CONSTRAINT "conversation_messages_system_id_fkey" FOREIGN KEY ("system_id") REFERENCES "public"."systems" ("id") ON DELETE SET NULL ON UPDATE NO ACTION;
ALTER TABLE "public"."conversations" ADD CONSTRAINT "conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE NO ACTION;
ALTER TABLE "public"."favorites" ADD CONSTRAINT "favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "public"."queries" ADD CONSTRAINT "queries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE NO ACTION;
ALTER TABLE "public"."queries" ADD CONSTRAINT "queries_system_id_fkey" FOREIGN KEY ("system_id") REFERENCES "public"."systems" ("id") ON DELETE SET NULL ON UPDATE NO ACTION;
ALTER TABLE "public"."query_history" ADD CONSTRAINT "query_history_query_id_fkey" FOREIGN KEY ("query_id") REFERENCES "public"."queries" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "public"."query_history" ADD CONSTRAINT "query_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE NO ACTION;
ALTER TABLE "public"."system_documentation" ADD CONSTRAINT "system_documentation_system_id_fkey" FOREIGN KEY ("system_id") REFERENCES "public"."systems" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "public"."system_documentation" ADD CONSTRAINT "system_documentation_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE NO ACTION;
ALTER TABLE "public"."system_logs" ADD CONSTRAINT "system_logs_system_id_fkey" FOREIGN KEY ("system_id") REFERENCES "public"."systems" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "public"."system_logs" ADD CONSTRAINT "system_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON DELETE SET NULL ON UPDATE NO ACTION;
CREATE FUNCTION "public"."gin_extract_query_trgm"() RETURNS INTERNAL LANGUAGE C
AS
$$
gin_extract_query_trgm
$$;
CREATE FUNCTION "public"."gin_extract_value_trgm"() RETURNS INTERNAL LANGUAGE C
AS
$$
gin_extract_value_trgm
$$;
CREATE FUNCTION "public"."gin_trgm_consistent"() RETURNS BOOLEAN LANGUAGE C
AS
$$
gin_trgm_consistent
$$;
CREATE FUNCTION "public"."gin_trgm_triconsistent"() RETURNS "CHAR" LANGUAGE C
AS
$$
gin_trgm_triconsistent
$$;
CREATE FUNCTION "public"."gtrgm_compress"() RETURNS INTERNAL LANGUAGE C
AS
$$
gtrgm_compress
$$;
CREATE FUNCTION "public"."gtrgm_consistent"() RETURNS BOOLEAN LANGUAGE C
AS
$$
gtrgm_consistent
$$;
CREATE FUNCTION "public"."gtrgm_decompress"() RETURNS INTERNAL LANGUAGE C
AS
$$
gtrgm_decompress
$$;
CREATE FUNCTION "public"."gtrgm_distance"() RETURNS DOUBLE PRECISION LANGUAGE C
AS
$$
gtrgm_distance
$$;
CREATE FUNCTION "public"."gtrgm_in"() RETURNS USER-DEFINED LANGUAGE C
AS
$$
gtrgm_in
$$;
CREATE FUNCTION "public"."gtrgm_options"() RETURNS VOID LANGUAGE C
AS
$$
gtrgm_options
$$;
CREATE FUNCTION "public"."gtrgm_out"() RETURNS CSTRING LANGUAGE C
AS
$$
gtrgm_out
$$;
CREATE FUNCTION "public"."gtrgm_penalty"() RETURNS INTERNAL LANGUAGE C
AS
$$
gtrgm_penalty
$$;
CREATE FUNCTION "public"."gtrgm_picksplit"() RETURNS INTERNAL LANGUAGE C
AS
$$
gtrgm_picksplit
$$;
CREATE FUNCTION "public"."gtrgm_same"() RETURNS INTERNAL LANGUAGE C
AS
$$
gtrgm_same
$$;
CREATE FUNCTION "public"."gtrgm_union"() RETURNS USER-DEFINED LANGUAGE C
AS
$$
gtrgm_union
$$;
CREATE FUNCTION "public"."set_limit"() RETURNS REAL LANGUAGE C
AS
$$
set_limit
$$;
CREATE FUNCTION "public"."show_limit"() RETURNS REAL LANGUAGE C
AS
$$
show_limit
$$;
CREATE FUNCTION "public"."show_trgm"() RETURNS ARRAY LANGUAGE C
AS
$$
show_trgm
$$;
CREATE FUNCTION "public"."similarity"() RETURNS REAL LANGUAGE C
AS
$$
similarity
$$;
CREATE FUNCTION "public"."similarity_dist"() RETURNS REAL LANGUAGE C
AS
$$
similarity_dist
$$;
CREATE FUNCTION "public"."similarity_op"() RETURNS BOOLEAN LANGUAGE C
AS
$$
similarity_op
$$;
CREATE FUNCTION "public"."strict_word_similarity"() RETURNS REAL LANGUAGE C
AS
$$
strict_word_similarity
$$;
CREATE FUNCTION "public"."strict_word_similarity_commutator_op"() RETURNS BOOLEAN LANGUAGE C
AS
$$
strict_word_similarity_commutator_op
$$;
CREATE FUNCTION "public"."strict_word_similarity_dist_commutator_op"() RETURNS REAL LANGUAGE C
AS
$$
strict_word_similarity_dist_commutator_op
$$;
CREATE FUNCTION "public"."strict_word_similarity_dist_op"() RETURNS REAL LANGUAGE C
AS
$$
strict_word_similarity_dist_op
$$;
CREATE FUNCTION "public"."strict_word_similarity_op"() RETURNS BOOLEAN LANGUAGE C
AS
$$
strict_word_similarity_op
$$;
CREATE FUNCTION "public"."update_updated_at_column"() RETURNS TRIGGER LANGUAGE PLPGSQL
AS
$$

BEGIN
NEW.updated_at = CURRENT_TIMESTAMP;
RETURN NEW;
END;

$$;
CREATE FUNCTION "public"."uuid_generate_v1"() RETURNS UUID LANGUAGE C
AS
$$
uuid_generate_v1
$$;
CREATE FUNCTION "public"."uuid_generate_v1mc"() RETURNS UUID LANGUAGE C
AS
$$
uuid_generate_v1mc
$$;
CREATE FUNCTION "public"."uuid_generate_v3"(IN namespace UUID, IN name TEXT) RETURNS UUID LANGUAGE C
AS
$$
uuid_generate_v3
$$;
CREATE FUNCTION "public"."uuid_generate_v4"() RETURNS UUID LANGUAGE C
AS
$$
uuid_generate_v4
$$;
CREATE FUNCTION "public"."uuid_generate_v5"(IN namespace UUID, IN name TEXT) RETURNS UUID LANGUAGE C
AS
$$
uuid_generate_v5
$$;
CREATE FUNCTION "public"."uuid_nil"() RETURNS UUID LANGUAGE C
AS
$$
uuid_nil
$$;
CREATE FUNCTION "public"."uuid_ns_dns"() RETURNS UUID LANGUAGE C
AS
$$
uuid_ns_dns
$$;
CREATE FUNCTION "public"."uuid_ns_oid"() RETURNS UUID LANGUAGE C
AS
$$
uuid_ns_oid
$$;
CREATE FUNCTION "public"."uuid_ns_url"() RETURNS UUID LANGUAGE C
AS
$$
uuid_ns_url
$$;
CREATE FUNCTION "public"."uuid_ns_x500"() RETURNS UUID LANGUAGE C
AS
$$
uuid_ns_x500
$$;
CREATE FUNCTION "public"."word_similarity"() RETURNS REAL LANGUAGE C
AS
$$
word_similarity
$$;
CREATE FUNCTION "public"."word_similarity_commutator_op"() RETURNS BOOLEAN LANGUAGE C
AS
$$
word_similarity_commutator_op
$$;
CREATE FUNCTION "public"."word_similarity_dist_commutator_op"() RETURNS REAL LANGUAGE C
AS
$$
word_similarity_dist_commutator_op
$$;
CREATE FUNCTION "public"."word_similarity_dist_op"() RETURNS REAL LANGUAGE C
AS
$$
word_similarity_dist_op
$$;
CREATE FUNCTION "public"."word_similarity_op"() RETURNS BOOLEAN LANGUAGE C
AS
$$
word_similarity_op
$$;
CREATE VIEW "public"."last_messages"
AS
 SELECT instance,
    remote_jid,
    (array_agg(text ORDER BY created_at DESC))[1] AS last_text,
    max(created_at) AS last_time
   FROM chat_messages
  GROUP BY instance, remote_jid;;
CREATE VIEW "public"."system_query_stats"
AS
 SELECT s.id,
    s.name,
    s.slug,
    count(q.id) AS total_queries,
    count(
        CASE
            WHEN ((q.status)::text = 'completed'::text) THEN 1
            ELSE NULL::integer
        END) AS completed_queries,
    count(
        CASE
            WHEN ((q.status)::text = 'failed'::text) THEN 1
            ELSE NULL::integer
        END) AS failed_queries,
    avg(q.execution_time_ms) AS avg_execution_time,
    max(q.created_at) AS last_query_at
   FROM (systems s
     LEFT JOIN queries q ON ((s.id = q.system_id)))
  GROUP BY s.id, s.name, s.slug;;
CREATE VIEW "public"."user_activity"
AS
 SELECT u.id,
    u.email,
    u.full_name,
    count(DISTINCT q.id) AS total_queries,
    count(DISTINCT c.id) AS total_conversations,
    max(q.created_at) AS last_query_at,
    max(u.last_login) AS last_login
   FROM ((users u
     LEFT JOIN queries q ON ((u.id = q.user_id)))
     LEFT JOIN conversations c ON ((u.id = c.user_id)))
  GROUP BY u.id, u.email, u.full_name;;
