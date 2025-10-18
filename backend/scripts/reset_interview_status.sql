-- SQL queries to update interview status directly in the database

-- 1. List all interviews and their current status
SELECT id, status, candidate_id, company_id, scheduled_at, started_at, ended_at 
FROM interview_sessions 
ORDER BY scheduled_at DESC;

-- 2. Update a specific interview to "scheduled" status (replace YOUR_INTERVIEW_ID with actual ID)
UPDATE interview_sessions 
SET 
    status = 'scheduled',
    started_at = NULL,
    ended_at = NULL,
    duration_minutes = NULL,
    ai_analysis = NULL,
    ai_metrics = NULL,
    ai_transcript_summary = NULL,
    ai_journal_notes = NULL,
    final_code_submitted = NULL
WHERE id = 'YOUR_INTERVIEW_ID';

-- 3. Update a specific interview to "in_progress" status (replace YOUR_INTERVIEW_ID with actual ID)
UPDATE interview_sessions 
SET 
    status = 'in_progress',
    started_at = COALESCE(started_at, datetime('now')),
    ended_at = NULL,
    ai_analysis = NULL,
    ai_metrics = NULL,
    ai_transcript_summary = NULL,
    ai_journal_notes = NULL,
    final_code_submitted = NULL
WHERE id = 'YOUR_INTERVIEW_ID';

-- 4. Reset all completed interviews to scheduled (BE CAREFUL with this!)
-- UPDATE interview_sessions 
-- SET 
--     status = 'scheduled',
--     started_at = NULL,
--     ended_at = NULL,
--     duration_minutes = NULL,
--     ai_analysis = NULL,
--     ai_metrics = NULL,
--     ai_transcript_summary = NULL,
--     ai_journal_notes = NULL,
--     final_code_submitted = NULL
-- WHERE status = 'completed';

-- 5. Find interviews that need to be reset (completed interviews)
SELECT id, status, candidate_id, company_id, ended_at
FROM interview_sessions 
WHERE status = 'completed'
ORDER BY ended_at DESC;