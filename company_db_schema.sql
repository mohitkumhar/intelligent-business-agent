--
-- PostgreSQL database dump
--

\restrict SVJxlCtTMmcx9hZUe8enJ95JZgCtIS05AtcATzacX81VNhGCuz1jgdf1X6LH4B7

-- Dumped from database version 18.2
-- Dumped by pg_dump version 18.2

-- Started on 2026-02-21 16:07:52

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
-- TOC entry 2 (class 3079 OID 29350)
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- TOC entry 5157 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 238 (class 1259 OID 29569)
-- Name: alerts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.alerts (
    alert_id bigint NOT NULL,
    business_id uuid NOT NULL,
    alert_type character varying(100),
    severity character varying(20),
    message text,
    status character varying(20),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT alerts_severity_check CHECK (((severity)::text = ANY ((ARRAY['Low'::character varying, 'Medium'::character varying, 'High'::character varying])::text[]))),
    CONSTRAINT alerts_status_check CHECK (((status)::text = ANY ((ARRAY['Active'::character varying, 'Resolved'::character varying])::text[])))
);


ALTER TABLE public.alerts OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 29568)
-- Name: alerts_alert_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.alerts ALTER COLUMN alert_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.alerts_alert_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 240 (class 1259 OID 29587)
-- Name: business_health_scores; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.business_health_scores (
    health_score_id bigint NOT NULL,
    business_id uuid NOT NULL,
    overall_score numeric(5,2),
    cash_score numeric(5,2),
    profitability_score numeric(5,2),
    growth_score numeric(5,2),
    cost_control_score numeric(5,2),
    risk_score numeric(5,2),
    calculated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.business_health_scores OWNER TO postgres;

--
-- TOC entry 239 (class 1259 OID 29586)
-- Name: business_health_scores_health_score_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.business_health_scores ALTER COLUMN health_score_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.business_health_scores_health_score_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 220 (class 1259 OID 29388)
-- Name: businesses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.businesses (
    business_id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_name character varying(150) NOT NULL,
    industry_type character varying(100),
    owner_name character varying(150),
    monthly_target_revenue numeric(14,2),
    risk_appetite character varying(20),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT businesses_monthly_target_revenue_check CHECK ((monthly_target_revenue >= (0)::numeric)),
    CONSTRAINT businesses_risk_appetite_check CHECK (((risk_appetite)::text = ANY ((ARRAY['Low'::character varying, 'Medium'::character varying, 'High'::character varying])::text[])))
);


ALTER TABLE public.businesses OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 29487)
-- Name: daily_transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.daily_transactions (
    transaction_id bigint NOT NULL,
    business_id uuid NOT NULL,
    transaction_date date NOT NULL,
    type character varying(20),
    category character varying(100),
    amount numeric(14,2),
    description text,
    CONSTRAINT daily_transactions_amount_check CHECK ((amount >= (0)::numeric)),
    CONSTRAINT daily_transactions_type_check CHECK (((type)::text = ANY ((ARRAY['Revenue'::character varying, 'Expense'::character varying])::text[])))
);


ALTER TABLE public.daily_transactions OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 29486)
-- Name: daily_transactions_transaction_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.daily_transactions ALTER COLUMN transaction_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.daily_transactions_transaction_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 236 (class 1259 OID 29554)
-- Name: decision_outcomes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.decision_outcomes (
    decision_outcome_id bigint NOT NULL,
    decision_id bigint NOT NULL,
    actual_result text,
    profit_impact numeric(14,2),
    notes text,
    evaluated_at timestamp without time zone
);


ALTER TABLE public.decision_outcomes OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 29553)
-- Name: decision_outcomes_decision_outcome_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.decision_outcomes ALTER COLUMN decision_outcome_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.decision_outcomes_decision_outcome_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 234 (class 1259 OID 29536)
-- Name: decisions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.decisions (
    decision_id bigint NOT NULL,
    business_id uuid NOT NULL,
    decision_text text,
    decision_type character varying(50),
    decision_score numeric(5,2),
    risk_level character varying(20),
    success_probability numeric(5,2),
    status character varying(20),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT decisions_decision_type_check CHECK (((decision_type)::text = ANY ((ARRAY['Marketing'::character varying, 'Hiring'::character varying, 'Pricing'::character varying, 'Expansion'::character varying])::text[]))),
    CONSTRAINT decisions_status_check CHECK (((status)::text = ANY ((ARRAY['Approved'::character varying, 'Rejected'::character varying, 'Modified'::character varying])::text[])))
);


ALTER TABLE public.decisions OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 29535)
-- Name: decisions_decision_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.decisions ALTER COLUMN decision_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.decisions_decision_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 232 (class 1259 OID 29521)
-- Name: employees; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employees (
    employee_id bigint NOT NULL,
    business_id uuid NOT NULL,
    name character varying(150),
    role character varying(100),
    salary numeric(14,2),
    status character varying(20),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT employees_status_check CHECK (((status)::text = ANY ((ARRAY['Active'::character varying, 'Left'::character varying])::text[])))
);


ALTER TABLE public.employees OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 29520)
-- Name: employees_employee_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.employees ALTER COLUMN employee_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.employees_employee_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 226 (class 1259 OID 29469)
-- Name: financial_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.financial_records (
    financial_record_id bigint NOT NULL,
    business_id uuid NOT NULL,
    month integer,
    year integer,
    total_revenue numeric(14,2) DEFAULT 0,
    total_expenses numeric(14,2) DEFAULT 0,
    net_profit numeric(14,2),
    cash_balance numeric(14,2),
    loans_due numeric(14,2),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT financial_records_month_check CHECK (((month >= 1) AND (month <= 12))),
    CONSTRAINT financial_records_year_check CHECK ((year >= 2000))
);


ALTER TABLE public.financial_records OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 29468)
-- Name: financial_records_financial_record_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.financial_records ALTER COLUMN financial_record_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.financial_records_financial_record_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 230 (class 1259 OID 29505)
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    product_id bigint NOT NULL,
    business_id uuid NOT NULL,
    product_name character varying(150) NOT NULL,
    cost_price numeric(14,2),
    selling_price numeric(14,2),
    stock_quantity integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.products OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 29504)
-- Name: products_product_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.products ALTER COLUMN product_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.products_product_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 222 (class 1259 OID 29423)
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    role_id bigint NOT NULL,
    business_id uuid NOT NULL,
    role_name character varying(100) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 29422)
-- Name: roles_role_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.roles ALTER COLUMN role_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.roles_role_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 224 (class 1259 OID 29442)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    user_id bigint NOT NULL,
    business_id uuid NOT NULL,
    role_id bigint NOT NULL,
    name character varying(150) NOT NULL,
    email character varying(150) NOT NULL,
    password_hash text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 29441)
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.users ALTER COLUMN user_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.users_user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 4991 (class 2606 OID 29580)
-- Name: alerts alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT alerts_pkey PRIMARY KEY (alert_id);


--
-- TOC entry 4993 (class 2606 OID 29594)
-- Name: business_health_scores business_health_scores_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.business_health_scores
    ADD CONSTRAINT business_health_scores_pkey PRIMARY KEY (health_score_id);


--
-- TOC entry 4969 (class 2606 OID 29399)
-- Name: businesses businesses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.businesses
    ADD CONSTRAINT businesses_pkey PRIMARY KEY (business_id);


--
-- TOC entry 4981 (class 2606 OID 29498)
-- Name: daily_transactions daily_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.daily_transactions
    ADD CONSTRAINT daily_transactions_pkey PRIMARY KEY (transaction_id);


--
-- TOC entry 4989 (class 2606 OID 29562)
-- Name: decision_outcomes decision_outcomes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.decision_outcomes
    ADD CONSTRAINT decision_outcomes_pkey PRIMARY KEY (decision_outcome_id);


--
-- TOC entry 4987 (class 2606 OID 29547)
-- Name: decisions decisions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.decisions
    ADD CONSTRAINT decisions_pkey PRIMARY KEY (decision_id);


--
-- TOC entry 4985 (class 2606 OID 29529)
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (employee_id);


--
-- TOC entry 4979 (class 2606 OID 29480)
-- Name: financial_records financial_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.financial_records
    ADD CONSTRAINT financial_records_pkey PRIMARY KEY (financial_record_id);


--
-- TOC entry 4983 (class 2606 OID 29514)
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (product_id);


--
-- TOC entry 4971 (class 2606 OID 29435)
-- Name: roles roles_business_id_role_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_business_id_role_name_key UNIQUE (business_id, role_name);


--
-- TOC entry 4973 (class 2606 OID 29433)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (role_id);


--
-- TOC entry 4975 (class 2606 OID 29457)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4977 (class 2606 OID 29455)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- TOC entry 5003 (class 2606 OID 29581)
-- Name: alerts alerts_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT alerts_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(business_id) ON DELETE CASCADE;


--
-- TOC entry 5004 (class 2606 OID 29595)
-- Name: business_health_scores business_health_scores_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.business_health_scores
    ADD CONSTRAINT business_health_scores_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(business_id) ON DELETE CASCADE;


--
-- TOC entry 4998 (class 2606 OID 29499)
-- Name: daily_transactions daily_transactions_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.daily_transactions
    ADD CONSTRAINT daily_transactions_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(business_id) ON DELETE CASCADE;


--
-- TOC entry 5002 (class 2606 OID 29563)
-- Name: decision_outcomes decision_outcomes_decision_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.decision_outcomes
    ADD CONSTRAINT decision_outcomes_decision_id_fkey FOREIGN KEY (decision_id) REFERENCES public.decisions(decision_id) ON DELETE CASCADE;


--
-- TOC entry 5001 (class 2606 OID 29548)
-- Name: decisions decisions_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.decisions
    ADD CONSTRAINT decisions_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(business_id) ON DELETE CASCADE;


--
-- TOC entry 5000 (class 2606 OID 29530)
-- Name: employees employees_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(business_id) ON DELETE CASCADE;


--
-- TOC entry 4997 (class 2606 OID 29481)
-- Name: financial_records financial_records_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.financial_records
    ADD CONSTRAINT financial_records_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(business_id) ON DELETE CASCADE;


--
-- TOC entry 4999 (class 2606 OID 29515)
-- Name: products products_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(business_id) ON DELETE CASCADE;


--
-- TOC entry 4994 (class 2606 OID 29436)
-- Name: roles roles_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(business_id) ON DELETE CASCADE;


--
-- TOC entry 4995 (class 2606 OID 29458)
-- Name: users users_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(business_id) ON DELETE CASCADE;


--
-- TOC entry 4996 (class 2606 OID 29463)
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(role_id);


-- Completed on 2026-02-21 16:07:52

--
-- PostgreSQL database dump complete
--

\unrestrict SVJxlCtTMmcx9hZUe8enJ95JZgCtIS05AtcATzacX81VNhGCuz1jgdf1X6LH4B7

