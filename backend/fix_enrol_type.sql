-- Fix the enrollment type constraint to properly show Credit for Audit

-- Step 1: Create a new type with the corrected values
ALTER TABLE course_enrollment DROP CONSTRAINT IF EXISTS course_enrollment_enrol_type_check;

-- Step 2: Add the corrected constraint
ALTER TABLE course_enrollment
ADD CONSTRAINT course_enrollment_enrol_type_check CHECK (
  enrol_type::text = ANY(
    ARRAY[
      'Credit'::character varying,
      'Credit for Minor'::character varying,
      'Credit for Audit'::character varying
    ]::text[]
  )
);

-- Step 3: Update existing 'Audit' entries to 'Credit for Audit'
UPDATE course_enrollment 
SET enrol_type = 'Credit for Audit' 
WHERE enrol_type = 'Audit';

-- Step 4: Update 'Credit for Concent' entries to 'Credit for Audit' if they exist
UPDATE course_enrollment 
SET enrol_type = 'Credit for Audit' 
WHERE enrol_type = 'Credit for Concent';
