import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomBytes, scrypt as scryptCallback } from 'node:crypto'
import { promisify } from 'node:util'

const directory = path.join(path.dirname(fileURLToPath(import.meta.url)), 'migrations')
const scrypt = promisify(scryptCallback)

async function defaultAccountParams() {
  const name = process.env.DEFAULT_ACCOUNT_NAME?.trim()
  const email = process.env.DEFAULT_ACCOUNT_EMAIL?.trim().toLowerCase()
  const password = process.env.DEFAULT_ACCOUNT_PASSWORD
  if (!name || !email || !password) {
    throw new Error('Set DEFAULT_ACCOUNT_NAME, DEFAULT_ACCOUNT_EMAIL, and DEFAULT_ACCOUNT_PASSWORD before applying the default account migration')
  }
  if (password.length < 10) throw new Error('DEFAULT_ACCOUNT_PASSWORD must contain at least 10 characters')
  const salt = randomBytes(16).toString('hex')
  const passwordHash = (await scrypt(password, salt, 64)).toString('hex')
  return [email, name, passwordHash, salt]
}

export async function runMigrations(pool) {
  await pool.query('CREATE TABLE IF NOT EXISTS schema_migrations (version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())')
  const files = (await readdir(directory)).filter((file) => file.endsWith('.sql')).sort()
  for (const file of files) {
    const exists = await pool.query('SELECT 1 FROM schema_migrations WHERE version=$1', [file])
    if (exists.rowCount) continue
    const sql = await readFile(path.join(directory, file), 'utf8')
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const params = file === '002_default_account.sql' ? await defaultAccountParams() : undefined
      await client.query(sql, params)
      if (file === '003_super_admin_missions.sql') {
        const email = process.env.DEFAULT_ACCOUNT_EMAIL?.trim().toLowerCase()
        if (!email) throw new Error('Set DEFAULT_ACCOUNT_EMAIL before applying the super-admin migration')
        await client.query("UPDATE users SET role='super_admin' WHERE email=$1", [email])
      }
      await client.query('INSERT INTO schema_migrations(version) VALUES($1)', [file])
      await client.query('COMMIT')
      console.log(`Applied migration ${file}`)
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }
}
