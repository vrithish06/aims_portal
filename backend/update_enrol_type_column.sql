-- Increase the enrol_type column size to accommodate longer values
ALTER TABLE course_enrollment 
ALTER COLUMN enrol_type TYPE character varying(50);

-- Update any existing truncated values
UPDATE course_enrollment 
SET enrol_type = 'Credit for Audit' 
WHERE enrol_type = 'Audit' OR enrol_type = 'Credit for Concent';
