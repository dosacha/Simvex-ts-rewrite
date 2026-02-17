DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_workflow_connections_from_node'
  ) THEN
    ALTER TABLE workflow_connections
      ADD CONSTRAINT fk_workflow_connections_from_node
      FOREIGN KEY (from_node_id)
      REFERENCES workflow_nodes(id)
      ON DELETE CASCADE;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_workflow_connections_to_node'
  ) THEN
    ALTER TABLE workflow_connections
      ADD CONSTRAINT fk_workflow_connections_to_node
      FOREIGN KEY (to_node_id)
      REFERENCES workflow_nodes(id)
      ON DELETE CASCADE;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_workflow_files_node'
  ) THEN
    ALTER TABLE workflow_files
      ADD CONSTRAINT fk_workflow_files_node
      FOREIGN KEY (node_id)
      REFERENCES workflow_nodes(id)
      ON DELETE CASCADE;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_workflow_connections_not_self'
  ) THEN
    ALTER TABLE workflow_connections
      ADD CONSTRAINT chk_workflow_connections_not_self
      CHECK (from_node_id <> to_node_id);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uq_workflow_connections_user_edge_anchor'
  ) THEN
    ALTER TABLE workflow_connections
      ADD CONSTRAINT uq_workflow_connections_user_edge_anchor
      UNIQUE (user_id, from_node_id, to_node_id, from_anchor, to_anchor);
  END IF;
END$$;
