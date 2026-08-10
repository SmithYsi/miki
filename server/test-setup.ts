// Aislar los tests de la DB de dev: cada archivo de test corre en su propio proceso
// y obtiene una DB ":memory:" (auto-seedeada por db.ts). Importar ANTES que db.js.
process.env.MIKI_DB_PATH = ":memory:";
