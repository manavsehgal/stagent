ALTER TABLE notifications
  ADD COLUMN workflow_id TEXT REFERENCES workflows(id) ON DELETE CASCADE;
ALTER TABLE notifications
  ADD COLUMN workflow_run_number INTEGER;
CREATE INDEX IF NOT EXISTS idx_notifications_workflow_run
  ON notifications(workflow_id, workflow_run_number);
ALTER TABLE agent_logs
  ADD COLUMN workflow_id TEXT REFERENCES workflows(id) ON DELETE CASCADE;
ALTER TABLE agent_logs
  ADD COLUMN workflow_run_number INTEGER;
CREATE INDEX IF NOT EXISTS idx_agent_logs_workflow_run
  ON agent_logs(workflow_id, workflow_run_number);
