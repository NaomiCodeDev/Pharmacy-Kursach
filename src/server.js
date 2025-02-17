const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// Путь к папке базы данных (на уровень выше, т.к. server.js в src/)
const dbFolder = path.join(__dirname, '../database');
if (!fs.existsSync(dbFolder)) {
  fs.mkdirSync(dbFolder);
}

const dbPath = path.join(dbFolder, 'Pharmacy.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Ошибка при подключении к базе данных:", err.message);
  } else {
    console.log("Успешное подключение к базе данных");
  }
});

// Создаем таблицу medicines, если она не существует
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS medicines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      form TEXT,
      dosage TEXT,
      manufacturer TEXT,
      expiryDate TEXT,
      quantity INTEGER DEFAULT 0,
      price REAL DEFAULT 0
    )
  `, (err) => {
    if (err) {
      console.error("Ошибка при создании таблицы medicines:", err.message);
    } else {
      console.log("Таблица medicines успешно создана или уже существует");
    }
  });
});

// GET /api/medicines - получение всех препаратов
app.get('/api/medicines', (req, res) => {
  db.all("SELECT * FROM medicines", (err, rows) => {
    if (err) {
      console.error("Ошибка при получении данных:", err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// POST /api/medicines - добавление нового препарата
app.post('/api/medicines', (req, res) => {
  const { name, form, dosage, manufacturer, expiryDate, quantity, price } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Название препарата обязательно" });
  }
  const query = `
    INSERT INTO medicines (name, form, dosage, manufacturer, expiryDate, quantity, price)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  db.run(query, [name, form, dosage, manufacturer, expiryDate, quantity || 0, price || 0], function(err) {
    if (err) {
      console.error("Ошибка при добавлении препарата:", err.message);
      return res.status(500).json({ error: err.message });
    }
    const newMedicine = {
      id: this.lastID,
      name,
      form,
      dosage,
      manufacturer,
      expiryDate,
      quantity: quantity || 0,
      price: price || 0
    };
    res.json(newMedicine);
  });
});

// PUT /api/medicines/:id - обновление препарата по ID
app.put('/api/medicines/:id', (req, res) => {
  const { id } = req.params;
  const { name, form, dosage, manufacturer, expiryDate, quantity, price } = req.body;
  const query = `
    UPDATE medicines
    SET name = ?, form = ?, dosage = ?, manufacturer = ?, expiryDate = ?, quantity = ?, price = ?
    WHERE id = ?
  `;
  db.run(query, [name, form, dosage, manufacturer, expiryDate, quantity, price, id], function(err) {
    if (err) {
      console.error("Ошибка при обновлении препарата:", err.message);
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "Препарат не найден" });
    }
    // Отправляем обновленные данные
    res.json({ id: Number(id), name, form, dosage, manufacturer, expiryDate, quantity, price });
  });
});

// DELETE /api/medicines/:id - удаление препарата по ID
app.delete('/api/medicines/:id', (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM medicines WHERE id = ?", [id], function(err) {
    if (err) {
      console.error("Ошибка при удалении препарата:", err.message);
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "Препарат не найден" });
    }
    res.json({ message: "Препарат удалён", id });
  });
});

// Запуск сервера
const port = 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Обработка закрытия подключения к базе данных при завершении работы
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Closed the database connection.');
    process.exit(0);
  });
});
