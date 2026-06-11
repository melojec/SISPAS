import { test, expect } from '@playwright/test'

const ADMIN_EMAIL = 'admin@sesa.ma.gov.br'
const ADMIN_SENHA = '0000'

test.describe('Autenticação', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })

  test('exibe tela de login com logotipo e campos', async ({ page }) => {
    await expect(page.getByRole('img', { name: 'SISPAS' })).toBeVisible({ timeout: 10000 })
    await expect(page.getByLabel('E-mail')).toBeVisible()
    await expect(page.getByLabel('Senha')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible()
  })

  test('botão de dark mode está visível no login', async ({ page }) => {
    const btn = page.getByTitle(/modo/i)
    await expect(btn).toBeVisible({ timeout: 10000 })
  })

  test('login com credenciais inválidas exibe mensagem de erro', async ({ page }) => {
    await page.getByLabel('E-mail').fill('errado@sespas.ma.gov.br')
    await page.getByLabel('Senha').fill('senhaerrada')
    await page.getByRole('button', { name: 'Entrar' }).click()
    await expect(page.getByText(/inválidos/i)).toBeVisible({ timeout: 10000 })
  })

  test('login com sucesso redireciona para o dashboard', async ({ page }) => {
    await page.getByLabel('E-mail').fill(ADMIN_EMAIL)
    await page.getByLabel('Senha').fill(ADMIN_SENHA)
    await page.getByRole('button', { name: 'Entrar' }).click()
    await expect(page).toHaveURL(/\/$/, { timeout: 10000 })
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 10000 })
  })

  test('rota protegida redireciona para login se não autenticado', async ({ page }) => {
    await page.goto('/domi')
    await expect(page).toHaveURL(/login/, { timeout: 10000 })
  })
})
