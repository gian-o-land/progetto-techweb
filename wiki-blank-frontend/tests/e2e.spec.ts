import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173'; 

test.describe('WikiBlank - Test End-to-End', () => {
  
  // Usiamo un timestamp per creare un utente sempre nuovo ad ogni avvio dei test, 
  // evitando conflitti di "Username già esistente" nel database.
  const uniqueUsername = `tester_${Date.now()}`;
  const password = 'SicuraPassword123!';

  // --- GRUPPO 1: AUTENTICAZIONE E SICUREZZA ---

  test('1. Registrazione di un nuovo utente', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);
    await page.fill('input[placeholder="Username"]', uniqueUsername);
    await page.fill('input[placeholder="Password"]', password);
    await page.click('button:has-text("Registrati")');
    
    // Il sistema deve reindirizzare alla pagina di login dopo il successo
    await expect(page.locator('h2:has-text("Accesso WikiBlank")')).toBeVisible();
  });

  test('2. Errore di Login con credenziali errate', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[placeholder="Username"]', 'utente_inesistente');
    await page.fill('input[placeholder="Password"]', 'password_sbagliata');
    await page.click('button:has-text("Entra")');
    
    // Deve comparire il messaggio di errore rosso
    await expect(page.locator('.text-danger')).toBeVisible();
  });

  test('3. Login con successo e salvataggio token', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[placeholder="Username"]', uniqueUsername);
    await page.fill('input[placeholder="Password"]', password);
    await page.click('button:has-text("Entra")');
    
    // L'utente loggato deve vedere la Dashboard/GamePage
    await expect(page.locator('h2:has-text("WikiBlank")')).toBeVisible();
  });

  test('4. Protezione delle rotte (Accesso negato senza token)', async ({ page }) => {
    // Tentiamo di accedere direttamente al gioco senza fare login
    await page.goto(BASE_URL);
    
    // Il componente <Navigate to="/login" /> deve respingerci istantaneamente
    await expect(page.locator('h2:has-text("Accesso WikiBlank")')).toBeVisible();
  });

  test('5. Logout e pulizia credenziali', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[placeholder="Username"]', uniqueUsername);
    await page.fill('input[placeholder="Password"]', password);
    await page.click('button:has-text("Entra")');

    await page.click('button:has-text("Esci")');
    await expect(page.locator('h2:has-text("Accesso WikiBlank")')).toBeVisible();
  });

  // --- GRUPPO 2: GIOCO E NAVIGAZIONE (Richiede utente autenticato) ---
  
  test.describe('Flussi utente autenticato', () => {
    
    // Creiamo un utente NUOVO prima di ogni singolo test per evitare che
    // le partite lasciate "in corso" dai test precedenti nascondano il menu a tendina
    test.beforeEach(async ({ page }) => {
      const runUser = `giocatore_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const pass = 'SicuraPassword123!';

      // 1. Registrazione al volo
      await page.goto(`${BASE_URL}/register`);
      await page.fill('input[placeholder="Username"]', runUser);
      await page.fill('input[placeholder="Password"]', pass);
      await page.click('button:has-text("Registrati")');
      
      // Attendiamo il reindirizzamento al login
      await expect(page.locator('h2:has-text("Accesso WikiBlank")')).toBeVisible();

      // 2. Login
      await page.fill('input[placeholder="Username"]', runUser);
      await page.fill('input[placeholder="Password"]', pass);
      await page.click('button:has-text("Entra")');

      // Attendiamo l'arrivo sulla dashboard di gioco
      await expect(page.locator('h2:has-text("WikiBlank")')).toBeVisible();
    });

    test('6. Avvio di una nuova partita tramite selezione categoria', async ({ page }) => {
      await page.selectOption('select', 'videogioco');
      await page.click('button:has-text("Nuova Partita")');
      
      // Aumentiamo il timeout a 20 secondi per compensare la lentezza di Wikipedia
      await expect(page.locator('.obfuscated-text-container')).toBeVisible({ timeout: 20000 });
    });

    test('7. Interazione: Invio di un tentativo parola', async ({ page }) => {
      await page.selectOption('select', 'film');
      await page.click('button:has-text("Nuova Partita")');
      
      // Aspettiamo che il gioco sia effettivamente caricato prima di scrivere
      await expect(page.locator('.obfuscated-text-container')).toBeVisible({ timeout: 20000 });
      
      await page.fill('input[placeholder="Indovina parola"]', 'il');
      await page.click('button:has-text("Invia")');
      
      await expect(page.locator('p:has-text("Tentativi:")')).toBeVisible();
    });

    test('8. Resa anticipata ed esposizione del titolo', async ({ page }) => {
      page.on('dialog', dialog => dialog.accept());

      await page.selectOption('select', 'libro');
      await page.click('button:has-text("Nuova Partita")');
      
      // Anche qui, aspettiamo che Wikipedia abbia risposto prima di arrenderci
      await expect(page.locator('.obfuscated-text-container')).toBeVisible({ timeout: 20000 });
      
      await page.click('button:has-text("Mi Arrendo")');
      
      await expect(page.locator('h3:has-text("Ti sei arreso")')).toBeVisible();
    });

    test('9. Navigazione verso la Classifica', async ({ page }) => {
      await page.click('button:has-text("Classifica")');
      
      await expect(page.locator('h2:has-text("Classifica WikiBlank")')).toBeVisible();
      await expect(page.locator('table.table')).toBeVisible();
    });

    test('10. Navigazione nello Storico e applicazione filtro', async ({ page }) => {
      await page.click('button:has-text("Storico")');
      await expect(page.locator('h2:has-text("Storico Partite Concluse")')).toBeVisible();
      
      await page.selectOption('select#history-category', 'serie tv');
      
      const selectedValue = await page.$eval('select#history-category', (el: HTMLSelectElement) => el.value);
      expect(selectedValue).toBe('serie tv');
    });
  });
});