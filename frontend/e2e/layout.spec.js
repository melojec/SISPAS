import { test, expect } from '@playwright/test'
import { login } from './helpers.js'

test.describe('Layout e Sidebar', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('sidebar exibe logotipo', async ({ page }) => {
    await expect(page.getByRole('img', { name: 'SISPAS' })).toBeVisible({ timeout: 10000 })
  })

  test('sidebar exibe links de navegação principais', async ({ page }) => {
    await expect(page.getByRole('link', { name: /dashboard/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /domi/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /relatórios/i })).toBeVisible()
  })

  test('sidebar exibe links restritos para admin', async ({ page }) => {
    await expect(page.getByRole('link', { name: /ciclos/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /usuários/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /auditoria/i })).toBeVisible()
  })

  test('botão de dark mode no header alterna o tema', async ({ page }) => {
    const html = page.locator('html')
    const btn = page.getByTitle(/modo/i).first()
    const antes = await html.getAttribute('class')
    await btn.click()
    const depois = await html.getAttribute('class')
    expect(antes).not.toBe(depois)
  })

  test('sino de notificações está visível no header', async ({ page }) => {
    const header = page.locator('header')
    await expect(header).toBeVisible()
    const sino = header.locator('button').last()
    await expect(sino).toBeVisible()
  })

  test('logout redireciona para login', async ({ page }) => {
    await page.getByRole('button', { name: /sair/i }).click()
    await expect(page).toHaveURL(/login/, { timeout: 10000 })
  })
})
