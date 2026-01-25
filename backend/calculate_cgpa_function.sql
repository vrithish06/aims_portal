-- PostgreSQL Function to Calculate CGPA for a Session
-- This function calculates SGPA and CGPA for all students with enrolled courses in the specified session
-- and updates the cgpa_table accordingly

CREATE OR REPLACE FUNCTION calculate_cgpa_for_session(p_session TEXT)
RETURNS INTEGER AS $$
DECLARE
  r RECORD;
  v_sgpa NUMERIC(4,2);
  v_cgpa NUMERIC(4,2);
  v_sem INTEGER;
  v_affected_count INTEGER := 0;
BEGIN
  FOR r IN 
    SELECT DISTINCT sc.student_id
    FROM student_credit sc
    JOIN course_enrollment ce 
      ON ce.enrollment_id = sc.enrol_id
    WHERE sc.acad_session = p_session
      AND ce.enrol_status = 'enrolled'
      AND sc.is_deleted = false
  LOOP

    -- ✅ Calculate SGPA (credit-weighted)
    SELECT ROUND(
      SUM(sc.cred_registered *
        CASE UPPER(sc.grade)
          WHEN 'A' THEN 10
          WHEN 'B' THEN 8
          WHEN 'C' THEN 6
          WHEN 'D' THEN 4
          ELSE 0
        END
      )::NUMERIC 
      / NULLIF(SUM(sc.cred_registered), 0),
      2
    )
    INTO v_sgpa
    FROM student_credit sc
    JOIN course_enrollment ce 
      ON ce.enrollment_id = sc.enrol_id
    WHERE sc.student_id = r.student_id
      AND sc.acad_session = p_session
      AND ce.enrol_status = 'enrolled'
      AND sc.is_deleted = false;

    -- ✅ Semester = count of previous sessions + 1
    SELECT COUNT(*) + 1
    INTO v_sem
    FROM cgpa_table
    WHERE student_id = r.student_id;

    -- ✅ Correct CGPA (credit-weighted across all semesters)
    SELECT ROUND(
      SUM(total_points) / NULLIF(SUM(total_credits), 0),
      2
    )
    INTO v_cgpa
    FROM (
      SELECT 
        sc.cred_registered AS total_credits,
        sc.cred_registered *
        CASE UPPER(sc.grade)
          WHEN 'A' THEN 10
          WHEN 'B' THEN 8
          WHEN 'C' THEN 6
          WHEN 'D' THEN 4
          ELSE 0
        END AS total_points
      FROM student_credit sc
      JOIN course_enrollment ce 
        ON ce.enrollment_id = sc.enrol_id
      WHERE sc.student_id = r.student_id
        AND ce.enrol_status = 'enrolled'
        AND sc.is_deleted = false
    ) t;

    -- ✅ Avoid duplicate insert (UPSERT)
    INSERT INTO cgpa_table (student_id, cg, sg, semester, session)
    VALUES (r.student_id, v_cgpa, v_sgpa, v_sem, p_session)
    ON CONFLICT (student_id, session)
    DO UPDATE SET
      cg = EXCLUDED.cg,
      sg = EXCLUDED.sg,
      semester = EXCLUDED.semester;

    v_affected_count := v_affected_count + 1;

  END LOOP;

  RETURN v_affected_count;
END;
$$ LANGUAGE plpgsql;
