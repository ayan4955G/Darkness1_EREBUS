import express from 'express'
import cookieParser from 'cookie-parser'
import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHash } from 'node:crypto'
import { promisify } from 'node:util'
import { Pool } from 'pg'
import { runMigrations } from './migrate.js'

const scrypt = promisify(scryptCallback)
const app = express()
const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgres://erebus_user:erebus_password@localhost:5432/erebus_db' })
const sessionCookie = 'erebus_session'
const sessionDays = 7
app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())

function asyncRoute(handler) { return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next) }
function hashToken(token) { return createHash('sha256').update(token).digest('hex') }
async function requireAuth(req, res, next) {
  const token = req.cookies?.[sessionCookie]
  if (!token) return res.status(401).json({ success: false, error: 'Authentication required' })
  const result = await pool.query('SELECT u.id, u.email, u.full_name AS "fullName", u.role FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at > now()', [hashToken(token)])
  if (!result.rowCount) return res.status(401).json({ success: false, error: 'Session expired' })
  req.user = result.rows[0]
  next()
}
function requireSuperAdmin(req, res, next) {
  if (req.user?.role !== 'super_admin') return res.status(403).json({ success: false, error: 'Super admin access required' })
  next()
}
function requireAnyRole(...roles) {
  return (req,res,next) => {
    if (req.user?.role === 'super_admin' || roles.includes(req.user?.role)) return next()
    return res.status(403).json({ success:false,error:'Your account does not have permission for this action' })
  }
}
const cookieOptions = { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: sessionDays * 86400000 }

app.get('/api/health', asyncRoute(async (_req, res) => {
  await pool.query('SELECT 1')
  res.json({ status: 'healthy', application: 'EREBUS Space Cloud Platform', timestamp: new Date().toISOString() })
}))

app.post('/api/auth/signup', asyncRoute(async (req, res) => {
  const { email, password, fullName } = req.body || {}
  if (typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email) || typeof password !== 'string' || password.length < 10 || typeof fullName !== 'string' || !fullName.trim()) return res.status(400).json({ success: false, error: 'Name, valid email, and password (at least 10 characters) are required' })
  const salt = randomBytes(16).toString('hex')
  const passwordHash = (await scrypt(password, salt, 64)).toString('hex')
  let user
  try {
    const created = await pool.query('INSERT INTO users(email, full_name, password_hash, password_salt) VALUES(lower($1),$2,$3,$4) RETURNING id,email,full_name AS "fullName",role', [email.trim(), fullName.trim(), passwordHash, salt])
    user = created.rows[0]
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ success: false, error: 'An account with this email already exists' })
    throw error
  }
  await createSession(user.id, res)
  res.status(201).json({ success: true, user })
}))
app.post('/api/auth/login', asyncRoute(async (req, res) => {
  const { email, password } = req.body || {}
  if (typeof email !== 'string' || typeof password !== 'string') return res.status(400).json({ success: false, error: 'Email and password are required' })
  const result = await pool.query('SELECT id,email,full_name AS "fullName",role,password_hash,password_salt FROM users WHERE email=lower($1)', [email.trim()])
  const user = result.rows[0]
  if (!user) return res.status(401).json({ success: false, error: 'Invalid email or password' })
  const candidate = await scrypt(password, user.password_salt, 64)
  if (!timingSafeEqual(candidate, Buffer.from(user.password_hash, 'hex'))) return res.status(401).json({ success: false, error: 'Invalid email or password' })
  delete user.password_hash; delete user.password_salt
  await createSession(user.id, res)
  res.json({ success: true, user })
}))
async function createSession(userId, res) {
  const token = randomBytes(32).toString('base64url')
  await pool.query('INSERT INTO sessions(user_id, token_hash, expires_at) VALUES($1,$2,now()+($3 * interval \'1 day\'))', [userId, hashToken(token), sessionDays])
  res.cookie(sessionCookie, token, cookieOptions)
}
app.get('/api/auth/me', requireAuth, (req, res) => res.json({ success: true, user: req.user }))
app.post('/api/auth/logout', asyncRoute(async (req, res) => {
  const token = req.cookies?.[sessionCookie]
  if (token) await pool.query('DELETE FROM sessions WHERE token_hash=$1', [hashToken(token)])
  res.clearCookie(sessionCookie, { ...cookieOptions, maxAge: undefined })
  res.json({ success: true })
}))

app.use('/api', (req, res, next) => {
  if (req.path.startsWith('/auth/') || req.path === '/health') return next()
  return requireAuth(req, res, next)
})

app.get('/api/admin/accounts', requireSuperAdmin, asyncRoute(async (_req,res) => {
  const result = await pool.query('SELECT id,email,full_name AS "fullName",role,created_at AS "createdAt" FROM users ORDER BY created_at ASC')
  const defaultEmail = process.env.DEFAULT_ACCOUNT_EMAIL?.trim().toLowerCase()
  res.json({ success:true, data:result.rows.map((user) => ({ ...user, isDefault: user.email === defaultEmail })) })
}))
app.post('/api/admin/accounts', requireSuperAdmin, asyncRoute(async (req,res) => {
  const { fullName,email,password,role='user' } = req.body || {}
  if (typeof fullName !== 'string' || !fullName.trim() || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email) || typeof password !== 'string' || password.length < 10) {
    return res.status(400).json({ success:false,error:'Name, valid email, and a password of at least 10 characters are required' })
  }
  if (!['user','super_admin','mission_operations','infrastructure_admin'].includes(role)) return res.status(400).json({ success:false,error:'Invalid account role' })
  const salt = randomBytes(16).toString('hex')
  const passwordHash = (await scrypt(password,salt,64)).toString('hex')
  try {
    const result = await pool.query('INSERT INTO users(email,full_name,password_hash,password_salt,role) VALUES(lower($1),$2,$3,$4,$5) RETURNING id,email,full_name AS "fullName",role,created_at AS "createdAt"',[email.trim(),fullName.trim(),passwordHash,salt,role])
    await logEvent(`Admin account created for ${result.rows[0].email}`,'info')
    res.status(201).json({success:true,data:result.rows[0]})
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({success:false,error:'An account with this email already exists'})
    throw error
  }
}))

app.get('/api/machines', asyncRoute(async (req, res) => {
  const { region, q } = req.query
  const values = []; const clauses = []
  if (region) { values.push(region); clauses.push(`region ILIKE $${values.length}`) }
  if (q) { values.push(`%${q}%`); clauses.push(`(name ILIKE $${values.length} OR mission ILIKE $${values.length} OR ip ILIKE $${values.length})`) }
  const result = await pool.query(`SELECT id,name,region,status,cpu,memory,image,ip,mission,created_at AS "createdAt",cpu_usage AS "cpuUsage",mem_usage AS "memUsage",temp_c AS "tempC" FROM machines ${clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''} ORDER BY created_at DESC`, values)
  res.json({ success: true, count: result.rowCount, data: result.rows })
}))
app.post('/api/machines', requireAnyRole('infrastructure_admin'), asyncRoute(async (req, res) => {
  const { name, region='EREBUS-CORE', cpu='32 vCPU', memory='256 GB', image='Orbital OS 24.04', mission='General purpose orbital compute workloads' } = req.body || {}
  if (typeof name !== 'string' || !name.trim() || typeof region !== 'string') return res.status(400).json({ success: false, error: 'Name and region are required' })
  const ip = `10.${randomBytes(1)[0] % 240 + 10}.4.${randomBytes(1)[0] % 240 + 10}`
  const result = await pool.query("INSERT INTO machines(name,region,status,cpu,memory,image,ip,mission) VALUES($1,$2,'Running',$3,$4,$5,$6,$7) RETURNING id,name,region,status,cpu,memory,image,ip,mission,created_at AS \"createdAt\",cpu_usage AS \"cpuUsage\",mem_usage AS \"memUsage\",temp_c AS \"tempC\"", [name.trim().toUpperCase().replace(/\s+/g,'-'), region, cpu, memory, image, ip, mission])
  await logEvent(`Deployed new rocket machine ${result.rows[0].name} in ${region}`, 'success')
  res.status(201).json({ success: true, data: result.rows[0] })
}))
app.get('/api/machines/:id', asyncRoute(async (req,res) => {
  const result = await pool.query('SELECT id,name,region,status,cpu,memory,image,ip,mission,created_at AS "createdAt",cpu_usage AS "cpuUsage",mem_usage AS "memUsage",temp_c AS "tempC" FROM machines WHERE id::text=$1 OR name=$1', [req.params.id])
  if (!result.rowCount) return res.status(404).json({ success:false,error:'Machine not found' })
  res.json({ success:true,data:result.rows[0] })
}))
app.patch('/api/machines/:id', asyncRoute(async (req,res) => {
  const {status}=req.body||{}
  if (!['Running','Stopped','Maintenance','Deploying'].includes(status)) return res.status(400).json({success:false,error:'Invalid machine status'})
  const result=await pool.query('UPDATE machines SET status=$2,updated_at=now() WHERE id::text=$1 OR name=$1 RETURNING id,name,region,status,cpu,memory,image,ip,mission,created_at AS "createdAt",cpu_usage AS "cpuUsage",mem_usage AS "memUsage",temp_c AS "tempC"',[req.params.id,status])
  if (!result.rowCount) return res.status(404).json({success:false,error:'Machine not found'})
  await logEvent(`Rocket machine ${result.rows[0].name} status updated to ${status}`, status==='Running'?'success':'warning')
  res.json({success:true,data:result.rows[0]})
}))
app.delete('/api/machines/:id', asyncRoute(async (req,res) => {
  const result=await pool.query('DELETE FROM machines WHERE id::text=$1 OR name=$1 RETURNING name',[req.params.id])
  if (!result.rowCount) return res.status(404).json({success:false,error:'Machine not found'})
  await logEvent(`Terminated rocket machine ${result.rows[0].name}`,'danger')
  res.json({success:true,message:`Machine ${req.params.id} terminated`})
}))

app.get('/api/missions', asyncRoute(async (_req,res) => {
  const result = await pool.query('SELECT mo.id,mo.name,mo.details,mo.status,mo.priority,mo.machine_id AS "machineId",m.name AS "machineName",mo.created_at AS "createdAt",u.full_name AS "createdBy" FROM mission_operations mo LEFT JOIN machines m ON m.id=mo.machine_id JOIN users u ON u.id=mo.created_by ORDER BY mo.created_at DESC')
  res.json({ success:true, count:result.rowCount, data:result.rows })
}))
app.post('/api/missions', requireAnyRole('mission_operations'), asyncRoute(async (req,res) => {
  const { name, details='', machineId=null, status='Planned', priority='Normal' } = req.body || {}
  if (typeof name !== 'string' || !name.trim()) return res.status(400).json({ success:false,error:'Mission name is required' })
  if (!['Planned','Active','On Hold','Completed'].includes(status)) return res.status(400).json({ success:false,error:'Invalid mission status' })
  if (!['Low','Normal','High','Critical'].includes(priority)) return res.status(400).json({ success:false,error:'Invalid mission priority' })
  if (machineId !== null && typeof machineId !== 'string') return res.status(400).json({ success:false,error:'Invalid machine selection' })
  const result = await pool.query('INSERT INTO mission_operations(name,details,machine_id,status,priority,created_by) VALUES($1,$2,$3,$4,$5,$6) RETURNING id,name,details,status,priority,machine_id AS "machineId",created_at AS "createdAt"',[name.trim(),String(details),machineId,status,priority,req.user.id])
  await logEvent(`Mission operation created: ${result.rows[0].name}`,'info')
  res.status(201).json({ success:true,data:result.rows[0] })
}))

app.get('/api/storage', asyncRoute(async (_req,res) => {
  const result=await pool.query('SELECT id,name,region,size_gb AS "sizeGb",object_count AS "objectCount",tier,redundancy,created_at AS "createdAt" FROM storage_buckets ORDER BY created_at DESC')
  res.json({success:true,count:result.rowCount,data:result.rows})
}))
app.post('/api/storage', asyncRoute(async (req,res) => {
  const {name,region='EREBUS-CORE',tier='Zero-G Cold',redundancy='3x Orbital Mirroring'}=req.body||{}
  if (typeof name!=='string'||!name.trim()) return res.status(400).json({success:false,error:'Bucket name is required'})
  const result=await pool.query('INSERT INTO storage_buckets(name,region,tier,redundancy) VALUES($1,$2,$3,$4) RETURNING id,name,region,size_gb AS "sizeGb",object_count AS "objectCount",tier,redundancy,created_at AS "createdAt"',[name.trim().toLowerCase().replace(/\s+/g,'-'),region,tier,redundancy])
  await logEvent(`Created space storage bucket '${result.rows[0].name}'`,'info')
  res.status(201).json({success:true,data:result.rows[0]})
}))
app.get('/api/telemetry', (_req,res) => {
  const now=new Date().toISOString(); const wave=Math.sin(Date.now()/10000)
  res.json({success:true,telemetry:{timestamp:now,orbitalPhysics:{velocityKmS:+(7.66+wave*.02).toFixed(3),altitudeKm:+(418.5+wave*2.1).toFixed(1),inclinationDeg:51.64,orbitalPeriodMin:92.68},powerAndThermal:{solarPowerOutputMw:+(84.6+wave*4.2).toFixed(1),batteryChargePercent:+(96.4+wave*1.5).toFixed(1),thermalCoreTempC:+(41.2+wave*2.8).toFixed(1),radiatorDissipationKw:+(310.4+wave*12).toFixed(1)},environmentalShielding:{cosmicRadiationFluxMsv:+(.14+Math.abs(wave)*.05).toFixed(3),geomagneticFieldStrengthUt:+(48.2+wave*3.1).toFixed(1),shieldIntegrityPercent:99.98},networkTopology:{laserCrosslinksActive:16,earthDownlinkGbps:+(18.6+wave*1.2).toFixed(2),interplanetaryLatencyMs:{'EREBUS-CORE':4,'ORBITAL-01':12,'ORBITAL-02':18,'LUNAR-01':1280,'MARS-RELAY':420000}}}})
})
app.get('/api/regions', asyncRoute(async (_req,res) => {
  const result=await pool.query('SELECT region, count(*)::int AS "machineCount" FROM machines GROUP BY region ORDER BY region')
  res.json({success:true,data:result.rows})
}))
app.get('/api/settings', asyncRoute(async (req,res) => {
  const result=await pool.query('SELECT radiation_threshold AS "radiationThreshold", updated_at AS "updatedAt" FROM user_settings WHERE user_id=$1',[req.user.id])
  res.json({success:true,data:result.rows[0]||{radiationThreshold:0.15}})
}))
app.put('/api/settings', asyncRoute(async (req,res) => {
  const threshold=Number(req.body?.radiationThreshold)
  if (!Number.isFinite(threshold)||threshold<=0) return res.status(400).json({success:false,error:'A positive radiation threshold is required'})
  const result=await pool.query('INSERT INTO user_settings(user_id,radiation_threshold) VALUES($1,$2) ON CONFLICT(user_id) DO UPDATE SET radiation_threshold=EXCLUDED.radiation_threshold,updated_at=now() RETURNING radiation_threshold AS "radiationThreshold",updated_at AS "updatedAt"',[req.user.id,threshold])
  res.json({success:true,data:result.rows[0]})
}))
app.get('/api/events', asyncRoute(async (req,res) => {
  const result=await pool.query('SELECT id,title,created_at AS timestamp,type FROM event_logs ORDER BY created_at DESC LIMIT 100')
  res.json({success:true,data:result.rows})
}))
app.post('/api/terminal', asyncRoute(async (req,res) => {
  const command=req.body?.command
  if (typeof command!=='string'||!command.trim()) return res.status(400).json({success:false,output:'Error: empty command string'})
  const [base,...args]=command.trim().split(/\s+/); const cmd=base.toLowerCase()
  let output
  if(req.body?.machineId){
    const found=await pool.query('SELECT id,name,status,cpu,memory,ip,cpu_usage AS "cpuUsage",mem_usage AS "memUsage",temp_c AS "tempC" FROM machines WHERE id::text=$1',[req.body.machineId])
    if(!found.rowCount) return res.status(404).json({success:false,output:'Machine not found'})
    const machine=found.rows[0]
    if(['health','status'].includes(cmd)) output=`ROCKET TELEMETRY: Hull: 99.8% | Core Temp: ${machine.tempC} C | Radiation Shield: ACTIVE`
    else if(cmd==='top') output=`CPU USAGE: ${machine.cpuUsage}% | MEMORY: ${machine.memUsage}% [vCPUs: ${machine.cpu}]`
    else if(cmd==='ping') output='PING Ground Gateway: 56 bytes, latency=0.38ms RTT.'
    else if(cmd==='ip') output=`INTERFACE eth0: inet ${machine.ip}/24 laser-tx`
    else if(cmd==='reboot'){await pool.query("UPDATE machines SET status='Running',updated_at=now() WHERE id=$1",[machine.id]);await logEvent(`Rebooted rocket machine ${machine.name}`,'warning');output=`[REBOOTING] Flight computer on ${machine.name} executing cold reboot cycle... Systems Nominal!`}
    else if(cmd==='help') output='Supported commands: health, top, ping, ip, reboot, clear'
    else output=`bash: command not found: ${command.trim()}. Type "help" for available commands.`
  }
  else if(cmd==='help') output='Commands: erebus status | erebus list | ping <region> | telemetry | help'
  else if(cmd==='erebus'&&args[0]==='status'){const r=await pool.query("SELECT count(*)::int AS total,count(*) FILTER(WHERE status='Running')::int AS running FROM machines");output=`EREBUS SPACE CLOUD CONTROL PLANE\\nActive Compute Nodes: ${r.rows[0].running}/${r.rows[0].total} running\\nTelemetry Link: NOMINAL`}
  else if(cmd==='erebus'&&args[0]==='list'){const r=await pool.query('SELECT name,region,status,cpu,ip FROM machines ORDER BY name');output='NAME\\tREGION\\tSTATUS\\tvCPU\\tIP\\n'+r.rows.map(m=>`${m.name}\\t${m.region}\\t${m.status}\\t${m.cpu}\\t${m.ip}`).join('\\n')}
  else if(cmd==='ping') output=`PING ${(args[0]||'EREBUS-CORE').toUpperCase()} (optical laser relay): 64 bytes sequence 1 ttl=128 time=4.2 ms`
  else if(cmd==='telemetry') output='ORBITAL TELEMETRY: 7.66 km/s | 420 km | 84.6 MW | 16 active crosslinks'
  else output=`command not found: ${command.trim()}. Type 'help' for command list.`
  res.json({success:true,output})
}))
async function logEvent(title,type='info') { await pool.query('INSERT INTO event_logs(title,type) VALUES($1,$2)',[title,type]) }
app.use((error,_req,res,_next)=>{ console.error(error); if (error.code === '23505') return res.status(409).json({success:false,error:'A record with that name already exists'}); res.status(500).json({success:false,error:'Internal server error'}) })

app.get('/api/auth/superadmin-info', (_req, res) => {
  const email = (process.env.DEFAULT_ACCOUNT_EMAIL || 'ayanshaikhdev@gmail.com').trim().toLowerCase()
  const name = (process.env.DEFAULT_ACCOUNT_NAME || 'EREBUS Administrator').trim()
  res.json({
    success: true,
    email,
    name,
  })
})

async function ensureDefaultSuperAdmin() {
  const name = process.env.DEFAULT_ACCOUNT_NAME?.trim() || 'EREBUS Administrator'
  const email = (process.env.DEFAULT_ACCOUNT_EMAIL?.trim() || 'ayanshaikhdev@gmail.com').toLowerCase()
  const password = process.env.DEFAULT_ACCOUNT_PASSWORD || 'ayanshaikh@970219'

  try {
    const existing = await pool.query('SELECT id, role, password_salt, password_hash FROM users WHERE email = lower($1)', [email])
    if (!existing.rowCount) {
      const salt = randomBytes(16).toString('hex')
      const passwordHash = (await scrypt(password, salt, 64)).toString('hex')
      await pool.query(
        "INSERT INTO users (email, full_name, password_hash, password_salt, role) VALUES (lower($1), $2, $3, $4, 'super_admin')",
        [email, name, passwordHash, salt]
      )
      console.log(`[AUTH] Default super-admin account initialized: ${email}`)
    } else {
      if (existing.rows[0].role !== 'super_admin') {
        await pool.query("UPDATE users SET role = 'super_admin' WHERE email = lower($1)", [email])
        console.log(`[AUTH] Elevated existing account to super_admin: ${email}`)
      }
    }
  } catch (error) {
    console.error('[AUTH] Could not verify/initialize default super-admin:', error.message)
  }
}

const port = Number(process.env.PORT || 1000)
runMigrations(pool)
  .then(() => ensureDefaultSuperAdmin())
  .then(() => app.listen(port, '0.0.0.0', () => console.log(`EREBUS API listening on ${port}`)))
  .catch((error) => {
    console.error('API startup failed', error)
    process.exit(1)
  })
