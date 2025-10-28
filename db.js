const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

let db = null;

async function connectDB() {
  if (!db) {
    try {
      db = await open({
        filename: path.join(__dirname, 'agencia_viajes.db'),
        driver: sqlite3.Database
      });

      await db.exec(`
        CREATE TABLE IF NOT EXISTS usuarios (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          Nombre TEXT NOT NULL,
          Apellido TEXT NOT NULL,
          DNI TEXT NOT NULL,
          Email TEXT UNIQUE NOT NULL,
          Contrasenia TEXT NOT NULL,
          Fecha DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      console.log("✅ Conectado a SQLite correctamente");
    } catch (error) {
      console.error("❌ Error al conectar a SQLite:", error);
      throw error;
    }
  }
  return db;
}

function getConnection() {
  if (!db) throw new Error("❌ No hay conexión a la base de datos");
  return db;
}

module.exports = { connectDB, getConnection };