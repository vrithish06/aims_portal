CREATE TABLE public.student_credit (
  credit_id serial NOT NULL,
  is_deleted boolean NULL DEFAULT false,
  student_id integer NOT NULL,
  acad_session character varying(20) NOT NULL,
  cred_earned numeric(4, 2) NULL DEFAULT 0,
  cred_registered numeric(4, 2) NULL DEFAULT 0,
  cred_earned_total numeric(6, 2) NULL DEFAULT 0,
  enrol_id integer NULL,
  grade character varying NULL,
  CONSTRAINT student_credit_pkey PRIMARY KEY (credit_id),
  CONSTRAINT student_credit_enrol_id_fkey FOREIGN KEY (enrol_id) REFERENCES course_enrollment (enrollment_id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT student_credit_student_id_fkey FOREIGN KEY (student_id) REFERENCES student (student_id) ON DELETE CASCADE
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_student_credit_session ON public.student_credit USING btree (student_id, acad_session) TABLESPACE pg_default;
