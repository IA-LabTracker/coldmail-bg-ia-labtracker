-- Função update_updated_at (rode só se ainda não existir)
CREATE
OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $ $ BEGIN NEW.updated_at = now();

RETURN NEW;

END;

$ $ LANGUAGE plpgsql;

-- Tabela linkedin_messages (versão simplificada e focada)
CREATE TABLE linkedin_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id text NOT NULL,
    campaign_name text NOT NULL DEFAULT '',
    -- IDs Unipile (tracking + dedup)
    chat_id text DEFAULT '',
    message_id text DEFAULT '',
    -- IDs únicos LinkedIn (essenciais para dedup e tracking)
    provider_id text DEFAULT '',
    -- ID único da Unipile
    public_identifier text DEFAULT '',
    -- lawrencejared
    member_urn text DEFAULT '',
    -- 569954882
    linkedin_url text NOT NULL DEFAULT '',
    -- Dados básicos do lead
    first_name text NOT NULL DEFAULT '',
    last_name text NOT NULL DEFAULT '',
    headline text DEFAULT '',
    location text DEFAULT '',
    -- Dados profissionais (empresa atual)
    current_company text NOT NULL DEFAULT '',
    current_position text NOT NULL DEFAULT '',
    -- Skills para personalização (apenas o essencial)
    top_skills text [] DEFAULT '{}',
    -- Top 5-10 skills
    -- Dados para qualificação/segmentação
    follower_count integer DEFAULT 0,
    connections_count integer DEFAULT 0,
    is_premium boolean DEFAULT false,
    -- Bio para personalização de mensagens
    profile_summary text DEFAULT '',
    -- Score automático para priorização
    lead_quality_score integer DEFAULT 0,
    -- Profile picture para interface
    profile_picture_url text DEFAULT '',
    -- Mensagem enviada
    message_sent text NOT NULL DEFAULT '',
    -- Status
    status text NOT NULL DEFAULT 'pending' CHECK (
        status IN (
            'pending',
            'sent',
            'delivered',
            'read',
            'replied',
            'failed'
        )
    ),
    -- Resposta
    response_content text DEFAULT '',
    response_message_id text DEFAULT '',
    lead_classification text DEFAULT 'cold' CHECK (lead_classification IN ('hot', 'warm', 'cold')),
    notes text DEFAULT '',
    -- Timestamps
    sent_at timestamptz,
    delivered_at timestamptz,
    read_at timestamptz,
    replied_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes essenciais
CREATE INDEX linkedin_messages_user_id_idx ON linkedin_messages(user_id);

CREATE INDEX linkedin_messages_account_id_idx ON linkedin_messages(account_id);

CREATE INDEX linkedin_messages_campaign_name_idx ON linkedin_messages(campaign_name);

CREATE INDEX linkedin_messages_status_idx ON linkedin_messages(status);

CREATE INDEX linkedin_messages_provider_id_idx ON linkedin_messages(provider_id);

CREATE INDEX linkedin_messages_public_identifier_idx ON linkedin_messages(public_identifier);

CREATE INDEX linkedin_messages_current_company_idx ON linkedin_messages(current_company);

CREATE INDEX linkedin_messages_lead_quality_score_idx ON linkedin_messages(lead_quality_score);

CREATE INDEX linkedin_messages_top_skills_gin_idx ON linkedin_messages USING gin(top_skills);

-- Auto-update updated_at
CREATE TRIGGER linkedin_messages_update_updated_at BEFORE
UPDATE
    ON linkedin_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE
    linkedin_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own linkedin_messages" ON linkedin_messages FOR
SELECT
    TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own linkedin_messages" ON linkedin_messages FOR
INSERT
    TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own linkedin_messages" ON linkedin_messages FOR
UPDATE
    TO authenticated USING (auth.uid() = user_id);

-- Função simplificada para calcular lead quality score
CREATE
OR REPLACE FUNCTION calculate_lead_quality_score(
    p_is_premium boolean,
    p_follower_count integer,
    p_connections_count integer,
    p_has_company boolean,
    p_skills_count integer
) RETURNS integer AS $ $ DECLARE score integer := 0;

BEGIN -- Premium = +30 pontos
IF p_is_premium THEN score := score + 30;

END IF;

-- Followers (max 35 pontos)
CASE
    WHEN p_follower_count >= 5000 THEN score := score + 35;

WHEN p_follower_count >= 1000 THEN score := score + 25;

WHEN p_follower_count >= 500 THEN score := score + 15;

WHEN p_follower_count >= 100 THEN score := score + 10;

ELSE score := score + 5;

END CASE
;

-- Connections (max 25 pontos)
CASE
    WHEN p_connections_count >= 500 THEN score := score + 25;

WHEN p_connections_count >= 200 THEN score := score + 20;

WHEN p_connections_count >= 100 THEN score := score + 15;

ELSE score := score + 5;

END CASE
;

-- Tem empresa = +10 pontos
IF p_has_company THEN score := score + 10;

END IF;

RETURN score;

END;

$ $ LANGUAGE plpgsql;

-- Trigger simplificado para auto-calcular lead quality score
CREATE
OR REPLACE FUNCTION update_lead_quality_score() RETURNS TRIGGER AS $ $ BEGIN NEW.lead_quality_score := calculate_lead_quality_score(
    NEW.is_premium,
    NEW.follower_count,
    NEW.connections_count,
    LENGTH(TRIM(NEW.current_company)) > 0,
    array_length(NEW.top_skills, 1)
);

RETURN NEW;

END;

$ $ LANGUAGE plpgsql;

CREATE TRIGGER linkedin_messages_update_lead_score BEFORE
INSERT
    OR
UPDATE
    ON linkedin_messages FOR EACH ROW EXECUTE FUNCTION update_lead_quality_score();