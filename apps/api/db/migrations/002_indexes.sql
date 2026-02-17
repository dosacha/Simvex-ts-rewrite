CREATE INDEX IF NOT EXISTS idx_memos_user_model ON memos (user_id, model_id);
CREATE INDEX IF NOT EXISTS idx_ai_histories_user_model ON ai_histories (user_id, model_id);

CREATE INDEX IF NOT EXISTS idx_workflow_nodes_user ON workflow_nodes (user_id);

CREATE INDEX IF NOT EXISTS idx_workflow_connections_user ON workflow_connections (user_id);
CREATE INDEX IF NOT EXISTS idx_workflow_connections_user_from_to
  ON workflow_connections (user_id, from_node_id, to_node_id);

CREATE INDEX IF NOT EXISTS idx_workflow_files_user ON workflow_files (user_id);
CREATE INDEX IF NOT EXISTS idx_workflow_files_user_node ON workflow_files (user_id, node_id);
