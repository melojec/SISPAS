import { test, expect } from '@playwright/test'
import { login } from './helpers.js'

test.describe('DOMI — Navegação', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await page.getByRole('link', { name: /domi/i }).click()
    await page.waitForURL(/domi/, { timeout: 10000 })
  })

  test('exibe coluna de diretrizes', async ({ page }) => {
    await expect(page.getByText('Diretrizes', { exact: true })).toBeVisible({ timeout: 10000 })
  })

  test('URL permanece em /domi', async ({ page }) => {
    await expect(page).toHaveURL(/domi/)
  })

  test('link ativo na sidebar está destacado', async ({ page }) => {
    const link = page.getByRole('link', { name: /domi/i })
    const classes = await link.getAttribute('class')
    expect(classes).toMatch(/active|bg-|text-white/)
  })
})

test.describe('DOMI — Estrutura', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await page.goto('/domi')
    await page.waitForURL(/domi/, { timeout: 10000 })
  })

  test('renderiza sem erros de console críticos', async ({ page }) => {
    const erros = []
    page.on('console', msg => {
      if (msg.type() === 'error') erros.push(msg.text())
    })
    await page.waitForTimeout(2000)
    const errosCriticos = erros.filter(e =>
      !e.includes('favicon') && !e.includes('404') && !e.includes('net::ERR')
    )
    expect(errosCriticos).toHaveLength(0)
  })

  test('área principal é renderizada', async ({ page }) => {
    await expect(page.locator('main')).toBeVisible()
  })
})
