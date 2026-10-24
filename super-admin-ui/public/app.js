const loginScreen = document.querySelector('#login-screen')
const adminApp = document.querySelector('#admin-app')
const loginMessage = document.querySelector('#login-message')
const accountMessage = document.querySelector('#account-message')
const accountsBody = document.querySelector('#accounts-body')
const accountForm = document.querySelector('#account-form')
const accountRoles = {
  super_admin: 'Super Admin',
  infrastructure_admin: 'Infrastructure & Orbital Machines',
  mission_operations: 'Mission Operations',
  user: 'Standard user',
}

function initials(name) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('') || 'OP'
}

function showMessage(element, message, success = false) {
  element.textContent = message
  element.classList.toggle('success-message', success)
}

async function api(path, options = {}) {
  const response = await fetch(path, { credentials: 'include', ...options, headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers } })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(result.error || 'Request failed')
  return result
}

function showConsole(user) {
  loginScreen.hidden = true
  adminApp.hidden = false
  document.querySelector('#profile-name').textContent = user.fullName
  document.querySelector('#profile-email').textContent = user.email
  document.querySelector('.avatar').textContent = initials(user.fullName)
  loadAccounts()
}

function showLogin(message = '') {
  adminApp.hidden = true
  loginScreen.hidden = false
  showMessage(loginMessage, message)
}

function appendText(parent, tag, text, className) {
  const node = document.createElement(tag)
  node.textContent = text
  if (className) node.className = className
  parent.append(node)
  return node
}

function renderAccounts(accounts) {
  accountsBody.replaceChildren()
  document.querySelector('#total-count').textContent = accounts.length.toString()
  document.querySelector('#mission-count').textContent = accounts.filter((account) => account.role === 'mission_operations').length.toString()
  document.querySelector('#infra-count').textContent = accounts.filter((account) => account.role === 'infrastructure_admin').length.toString()
  document.querySelector('#account-total-label').textContent = `${accounts.length} ${accounts.length === 1 ? 'account' : 'accounts'} in directory`

  if (!accounts.length) {
    const row = document.createElement('tr')
    const cell = appendText(row, 'td', 'No accounts found.', 'empty-row')
    cell.colSpan = 3
    accountsBody.append(row)
    return
  }

  for (const account of accounts) {
    const row = document.createElement('tr')
    const operatorCell = document.createElement('td')
    const operator = document.createElement('div'); operator.className = 'operator-cell'
    appendText(operator, 'span', initials(account.fullName), 'operator-avatar')
    const identity = document.createElement('span')
    appendText(identity, 'strong', account.fullName)
    appendText(identity, 'small', account.email)
    operator.append(identity); operatorCell.append(operator); row.append(operatorCell)

    const roleCell = document.createElement('td')
    const roleClass = `role-badge role-${account.role}`
    appendText(roleCell, 'span', accountRoles[account.role] || account.role, roleClass)
    if (account.isDefault) appendText(roleCell, 'small', 'ENV DEFAULT ACCOUNT', 'default-badge')
    row.append(roleCell)

    const created = new Date(account.createdAt)
    appendText(row, 'td', Number.isNaN(created.getTime()) ? '—' : created.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }))
    accountsBody.append(row)
  }
}

async function loadAccounts() {
  document.querySelector('#account-total-label').textContent = 'Loading accounts…'
  try {
    const result = await api('/api/admin/accounts')
    renderAccounts(result.data)
  } catch (error) {
    document.querySelector('#account-total-label').textContent = error.message
    if (error.message.includes('Super admin access')) showLogin('This account does not have super-admin access.')
  }
}

document.querySelector('#login-form').addEventListener('submit', async (event) => {
  event.preventDefault()
  showMessage(loginMessage, 'Signing in…')
  try {
    const result = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: document.querySelector('#login-email').value, password: document.querySelector('#login-password').value }),
    })
    if (result.user.role !== 'super_admin') {
      await api('/api/auth/logout', { method: 'POST' })
      throw new Error('This console is reserved for super-admin accounts.')
    }
    showConsole(result.user)
  } catch (error) {
    showMessage(loginMessage, error.message)
  }
})

accountForm.addEventListener('submit', async (event) => {
  event.preventDefault()
  const button = accountForm.querySelector('button[type="submit"]')
  button.disabled = true
  button.textContent = 'Creating account…'
  showMessage(accountMessage, '')
  const form = new FormData(accountForm)
  try {
    const result = await api('/api/admin/accounts', {
      method: 'POST',
      body: JSON.stringify({ fullName: form.get('fullName'), email: form.get('email'), password: form.get('password'), role: form.get('role') }),
    })
    accountForm.reset()
    document.querySelector('#account-role').value = 'mission_operations'
    showMessage(accountMessage, `Account created for ${result.data.email}.`, true)
    await loadAccounts()
  } catch (error) {
    showMessage(accountMessage, error.message)
  } finally {
    button.disabled = false
    button.innerHTML = 'Create operator <span>＋</span>'
  }
})

document.querySelector('#refresh-button').addEventListener('click', loadAccounts)
document.querySelector('#logout-button').addEventListener('click', async () => {
  try { await api('/api/auth/logout', { method: 'POST' }) } catch { /* always return to sign-in */ }
  showLogin()
})

api('/api/auth/me').then((result) => {
  if (result.user.role === 'super_admin') showConsole(result.user)
  else showLogin('Sign in with a super-admin account to continue.')
}).catch(() => showLogin())
