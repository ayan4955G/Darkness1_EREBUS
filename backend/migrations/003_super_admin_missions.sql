ALTER TABLE users
  ADD COLUMN role text NOT NULL DEFAULT 'user'
  CHECK (role IN ('user', 'super_admin'));

CREATE TABLE mission_operations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  details text NOT NULL DEFAULT '',
  machine_id uuid REFERENCES machines(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'Planned' CHECK (status IN ('Planned','Active','On Hold','Completed')),
  priority text NOT NULL DEFAULT 'Normal' CHECK (priority IN ('Low','Normal','High','Critical')),
  created_by uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX mission_operations_created_at_idx ON mission_operations(created_at DESC);
