import { test, expect } from '@playwright/test'
import { login } from './helpers.js'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('exibe título Dashboard', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible({ timeout: 10000 })
  })

  test('exibe card Total de Metas', async ({ page }) => {
    await expect(page.getByText(/total de metas/i)).toBeVisible({ timeout: 10000 })
  })

  test('exibe card Registros no Ciclo', async ({ page }) => {
    await expect(page.getByText(/registros no ciclo/i)).toBeVisible({ timeout: 10000 })
  })

  test('exibe card Validados', async ({ page }) => {
    await expect(page.getByText(/validados/i)).toBeVisible({ timeout: 10000 })
  })

  test('exibe card Pendentes', async ({ page }) => {
    await expect(page.getByText(/pendentes/i)).toBeVisible({ timeout: 10000 })
  })

  test('exibe saudação com nome do usuário', async ({ page }) => {
    await expect(page.getByText(/bem-vindo/i)).toBeVisible({ timeout: 10000 })
  })
})
