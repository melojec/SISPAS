const ADMIN_EMAIL = 'admin@sesa.ma.gov.br'
const ADMIN_SENHA = '0000'

export async function login(page, email = ADMIN_EMAIL, senha = ADMIN_SENHA) {
  await page.goto('/login')
  await page.evaluate(() => localStorage.clear())
  await page.goto('/login')
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Senha').fill(senha)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await page.waitForURL(/\/$/, { timeout: 15000 })
}
