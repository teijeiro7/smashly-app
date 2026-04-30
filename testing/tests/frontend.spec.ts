import { test, expect, type Page } from '@playwright/test';

const mockRackets = [
  {
    id: 1,
    nombre: 'Adidas Metalbone 3.1',
    marca: 'Adidas',
    modelo: 'Metalbone 3.1',
    imagenes: ['metalbone.jpg'],
    es_bestseller: true,
    en_oferta: true,
    descripcion: 'Pala de potencia',
    view_count: 60,
    padelnuestro_precio_actual: 270,
    padelnuestro_precio_original: 320,
    padelnuestro_descuento_porcentaje: 16,
    padelnuestro_enlace: 'https://example.com/adidas-metalbone',
    padelmarket_precio_actual: 250,
    padelmarket_precio_original: 300,
    padelmarket_descuento_porcentaje: 17,
    padelmarket_enlace: 'https://example.com/adidas-metalbone-market',
    padelproshop_precio_actual: 265,
    padelproshop_precio_original: 310,
    padelproshop_descuento_porcentaje: 15,
    padelproshop_enlace: 'https://example.com/adidas-metalbone-proshop',
    precio_actual: 250,
    precio_original: 300,
    descuento_porcentaje: 17,
    enlace: 'https://example.com/adidas-metalbone-market',
  },
  {
    id: 2,
    nombre: 'Bullpadel Vertex 04',
    marca: 'Bullpadel',
    modelo: 'Vertex 04',
    imagenes: ['vertex.jpg'],
    es_bestseller: false,
    en_oferta: false,
    descripcion: 'Pala de control',
    view_count: 20,
    padelnuestro_precio_actual: 190,
    padelnuestro_precio_original: 220,
    padelnuestro_descuento_porcentaje: 14,
    padelnuestro_enlace: 'https://example.com/bullpadel-vertex',
    padelmarket_precio_actual: 180,
    padelmarket_precio_original: 210,
    padelmarket_descuento_porcentaje: 14,
    padelmarket_enlace: 'https://example.com/bullpadel-vertex-market',
    padelproshop_precio_actual: 185,
    padelproshop_precio_original: 215,
    padelproshop_descuento_porcentaje: 14,
    padelproshop_enlace: 'https://example.com/bullpadel-vertex-proshop',
    precio_actual: 180,
    precio_original: 210,
    descuento_porcentaje: 14,
    enlace: 'https://example.com/bullpadel-vertex-market',
  },
];

const mockStats = {
  total: mockRackets.length,
  bestsellers: 1,
  onSale: 1,
  brands: 2,
};

async function mockCatalogApi(page: Page) {
  await page.route('**/api/v1/rackets', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: mockRackets }),
    });
  });

  await page.route('**/api/v1/rackets/stats', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: mockStats }),
    });
  });
}

async function openCatalog(page: Page) {
  await mockCatalogApi(page);
  await page.goto('/catalog', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('h1').filter({ hasText: /cat[aá]logo de palas/i })).toBeVisible();
  await expect(page.getByTestId('rackets-count')).toHaveText(
    `Total de palas mostradas: ${mockRackets.length}`
  );
}

test.describe('Catalog Page', () => {
  test('should display racket list', async ({ page }) => {
    await openCatalog(page);

    await expect(page.getByRole('listitem')).toHaveCount(mockRackets.length);
    await expect(page.getByRole('listitem').first()).toContainText('Adidas Metalbone 3.1');
  });

  test('should filter rackets by brand', async ({ page }) => {
    await openCatalog(page);

    await page.getByRole('combobox').first().selectOption('Adidas');

    await expect(page.getByTestId('rackets-count')).toHaveText('Total de palas mostradas: 1');
    await expect(page.getByRole('listitem')).toHaveCount(1);
    await expect(page.getByRole('listitem').first()).toContainText('Adidas Metalbone 3.1');
  });

  test('should sort rackets by price', async ({ page }) => {
    await openCatalog(page);

    await page.getByRole('combobox').nth(1).selectOption('price-low');

    await expect(page.getByRole('listitem').first()).toContainText('Bullpadel Vertex 04');
  });
});


test.describe('Responsive Design', () => {
  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await openCatalog(page);
    
    const title = await page.title();
    expect(title).toBeTruthy();
  });

  test('should work on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    await openCatalog(page);
    
    const title = await page.title();
    expect(title).toBeTruthy();
  });
});
