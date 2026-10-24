INSERT INTO users(email, full_name, password_hash, password_salt)
VALUES (lower($1), $2, $3, $4)
ON CONFLICT (email) DO NOTHING;
