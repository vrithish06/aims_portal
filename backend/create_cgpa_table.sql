CREATE TABLE public.cgpa_table (
  id serial NOT NULL,
  student_id integer NOT NULL,
  cg numeric(4, 2) NULL,
  sg numeric(4, 2) NULL,
  semester integer NOT NULL,
  session character varying NOT NULL,
  CONSTRAINT cgpa_table_pkey PRIMARY KEY (id),
  CONSTRAINT cgpa_table_student_semester_session_key UNIQUE (student_id, semester, session),
  CONSTRAINT cgpa_table_student_id_fkey FOREIGN KEY (student_id) REFERENCES student (student_id) ON DELETE CASCADE,
  CONSTRAINT cgpa_cg_check CHECK (((cg >= (0)::numeric) and (cg <= (10)::numeric))),
  CONSTRAINT cgpa_sg_check CHECK (((sg >= (0)::numeric) and (sg <= (10)::numeric)))
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_cgpa_student ON public.cgpa_table USING btree (student_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_cgpa_session ON public.cgpa_table USING btree (session) TABLESPACE pg_default;
