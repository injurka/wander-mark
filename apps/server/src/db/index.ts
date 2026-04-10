import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { Database } from 'bun:sqlite'
import { DB_PATH } from '../config'

const dbDir = path.dirname(DB_PATH)
mkdirSync(dbDir, { recursive: true })

export const db = new Database(DB_PATH)

// Таблица для плагина Hanzi Saver
db.run(`
  CREATE TABLE IF NOT EXISTS hanzi (
    char TEXT PRIMARY KEY,
    pinyin TEXT,
    translation TEXT,
    components TEXT,
    etymology TEXT,
    hsk TEXT,
    strokes INTEGER,
    part_of_speech TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`)

// Новая таблица для синхронизации прогресса чтения
db.run(`
  CREATE TABLE IF NOT EXISTS reading_logs (
    vault_id TEXT,
    identifier TEXT,
    path TEXT,
    title TEXT,
    read_dates TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (vault_id, identifier, path)
  )
`)

// eslint-disable-next-line no-console
console.log(`🗄️ SQLite Database initialized at ${DB_PATH}`)
