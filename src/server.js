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

// Создаем таблицы, если они не существуют
db.serialize(() => {
  // Таблица medicines
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

  // Таблица clients
  db.run(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fullName TEXT NOT NULL,
      birthDate TEXT,
      phoneNumber TEXT,
      address TEXT,
      purchaseHistory TEXT
    )
  `, (err) => {
    if (err) {
      console.error("Ошибка при создании таблицы clients:", err.message);
    } else {
      console.log("Таблица clients успешно создана или уже существует");
    }
  });

  // Таблица recipes
  db.run(`
    CREATE TABLE IF NOT EXISTS recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipeNumber TEXT NOT NULL,
      issueDate TEXT,
      patientName TEXT,
      prescribedMedicines TEXT,
      expiryDate TEXT
    )
  `, (err) => {
    if (err) {
      console.error("Ошибка при создании таблицы recipes:", err.message);
    } else {
      console.log("Таблица recipes успешно создана или уже существует");
    }
  });

  // Таблица sales
  db.run(`
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      saleDate TEXT NOT NULL,
      medicines TEXT NOT NULL,
      quantities TEXT NOT NULL,
      totalAmount REAL DEFAULT 0
    )
  `, (err) => {
    if (err) {
      console.error("Ошибка при создании таблицы sales:", err.message);
    } else {
      console.log("Таблица sales успешно создана или уже существует");
    }
  });

  // Таблица supplies
  db.run(`
    CREATE TABLE IF NOT EXISTS supplies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplyNumber TEXT NOT NULL,
      supplyDate TEXT,
      medicineList TEXT,
      quantity INTEGER DEFAULT 0,
      supplier TEXT
    )
  `, (err) => {
    if (err) {
      console.error("Ошибка при создании таблицы supplies:", err.message);
    } else {
      console.log("Таблица supplies успешно создана или уже существует");
    }
  });
});

// Обработчики для medicines
app.get('/api/medicines', (req, res) => {
  db.all("SELECT * FROM medicines", (err, rows) => {
    if (err) {
      console.error("Ошибка при получении данных:", err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

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
    res.json({ id: Number(id), name, form, dosage, manufacturer, expiryDate, quantity, price });
  });
});

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

// Обработчики для clients
app.get('/api/clients', (req, res) => {
  db.all("SELECT * FROM clients", (err, rows) => {
    if (err) {
      console.error("Ошибка при получении данных:", err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.post('/api/clients', (req, res) => {
  const { fullName, birthDate, phoneNumber, address, purchaseHistory } = req.body;
  if (!fullName) {
    return res.status(400).json({ error: "ФИО клиента обязательно" });
  }
  const query = `
    INSERT INTO clients (fullName, birthDate, phoneNumber, address, purchaseHistory)
    VALUES (?, ?, ?, ?, ?)
  `;
  db.run(query, [fullName, birthDate, phoneNumber, address, purchaseHistory], function(err) {
    if (err) {
      console.error("Ошибка при добавлении клиента:", err.message);
      return res.status(500).json({ error: err.message });
    }
    const newClient = {
      id: this.lastID,
      fullName,
      birthDate,
      phoneNumber,
      address,
      purchaseHistory
    };
    res.json(newClient);
  });
});

app.put('/api/clients/:id', (req, res) => {
  const { id } = req.params;
  const { fullName, birthDate, phoneNumber, address, purchaseHistory } = req.body;
  const query = `
    UPDATE clients
    SET fullName = ?, birthDate = ?, phoneNumber = ?, address = ?, purchaseHistory = ?
    WHERE id = ?
  `;
  db.run(query, [fullName, birthDate, phoneNumber, address, purchaseHistory, id], function(err) {
    if (err) {
      console.error("Ошибка при обновлении данных клиента:", err.message);
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "Клиент не найден" });
    }
    res.json({ id: Number(id), fullName, birthDate, phoneNumber, address, purchaseHistory });
  });
});

app.delete('/api/clients/:id', (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM clients WHERE id = ?", [id], function(err) {
    if (err) {
      console.error("Ошибка при удалении клиента:", err.message);
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "Клиент не найден" });
    }
    res.json({ message: "Клиент удалён", id });
  });
});

// Обработчики для recipes
app.get('/api/recipes', (req, res) => {
  db.all("SELECT * FROM recipes", (err, rows) => {
    if (err) {
      console.error("Ошибка при получении рецептов:", err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.post('/api/recipes', (req, res) => {
  const { recipeNumber, issueDate, patientName, prescribedMedicines, expiryDate } = req.body;
  if (!recipeNumber) {
    return res.status(400).json({ error: "Номер рецепта обязателен" });
  }
  const query = `
    INSERT INTO recipes (recipeNumber, issueDate, patientName, prescribedMedicines, expiryDate)
    VALUES (?, ?, ?, ?, ?)
  `;
  db.run(query, [recipeNumber, issueDate, patientName, prescribedMedicines, expiryDate], function(err) {
    if (err) {
      console.error("Ошибка при добавлении рецепта:", err.message);
      return res.status(500).json({ error: err.message });
    }
    const newRecipe = {
      id: this.lastID,
      recipeNumber,
      issueDate,
      patientName,
      prescribedMedicines,
      expiryDate
    };
    res.json(newRecipe);
  });
});

app.put('/api/recipes/:id', (req, res) => {
  const { id } = req.params;
  const { recipeNumber, issueDate, patientName, prescribedMedicines, expiryDate } = req.body;
  const query = `
    UPDATE recipes
    SET recipeNumber = ?, issueDate = ?, patientName = ?, prescribedMedicines = ?, expiryDate = ?
    WHERE id = ?
  `;
  db.run(query, [recipeNumber, issueDate, patientName, prescribedMedicines, expiryDate, id], function(err) {
    if (err) {
      console.error("Ошибка при обновлении рецепта:", err.message);
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "Рецепт не найден" });
    }
    res.json({ 
      id: Number(id), 
      recipeNumber, 
      issueDate, 
      patientName, 
      prescribedMedicines, 
      expiryDate 
    });
  });
});

app.delete('/api/recipes/:id', (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM recipes WHERE id = ?", [id], function(err) {
    if (err) {
      console.error("Ошибка при удалении рецепта:", err.message);
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "Рецепт не найден" });
    }
    res.json({ message: "Рецепт удалён", id });
  });
});

// Обработчики для sales
app.get('/api/sales', (req, res) => {
  db.all("SELECT * FROM sales", (err, rows) => {
    if (err) {
      console.error("Ошибка при получении данных о продажах:", err.message);
      return res.status(500).json({ error: err.message });
    }
    // Преобразование строк JSON обратно в объекты
    const parsedRows = rows.map(row => ({
      ...row,
      medicines: JSON.parse(row.medicines),
      quantities: JSON.parse(row.quantities)
    }));
    res.json(parsedRows);
  });
});

app.post('/api/sales', (req, res) => {
  const { saleDate, medicines, quantities, totalAmount } = req.body;
  
  if (!saleDate || !medicines || !quantities) {
    return res.status(400).json({ error: "Дата продажи, список препаратов и их количество обязательны" });
  }

  const query = `
    INSERT INTO sales (saleDate, medicines, quantities, totalAmount)
    VALUES (?, ?, ?, ?)
  `;

  // Преобразование объектов в строки JSON для хранения
  const medicinesJson = JSON.stringify(medicines);
  const quantitiesJson = JSON.stringify(quantities);

  db.run(query, [saleDate, medicinesJson, quantitiesJson, totalAmount], function(err) {
    if (err) {
      console.error("Ошибка при добавлении продажи:", err.message);
      return res.status(500).json({ error: err.message });
    }

    // Обновление количества препаратов в таблице medicines
    medicines.forEach((medicineId) => {
      db.run(
        "UPDATE medicines SET quantity = quantity - ? WHERE id = ?",
        [quantities[medicineId], medicineId]
      );
    });

    const newSale = {
      id: this.lastID,
      saleDate,
      medicines,
      quantities,
      totalAmount
    };
    res.json(newSale);
  });
});

app.put('/api/sales/:id', (req, res) => {
  const { id } = req.params;
  const { saleDate, medicines, quantities, totalAmount } = req.body;

  // Сначала получаем текущие данные о продаже
  db.get("SELECT * FROM sales WHERE id = ?", [id], (err, oldSale) => {
    if (err) {
      console.error("Ошибка при получении данных о продаже:", err.message);
      return res.status(500).json({ error: err.message });
    }

    if (!oldSale) {
      return res.status(404).json({ error: "Продажа не найдена" });
    }

    const oldMedicines = JSON.parse(oldSale.medicines);
    const oldQuantities = JSON.parse(oldSale.quantities);

    // Возвращаем старые количества в наличие
    oldMedicines.forEach((medicineId) => {
      db.run(
        "UPDATE medicines SET quantity = quantity + ? WHERE id = ?",
        [oldQuantities[medicineId], medicineId]
      );
    });

    // Обновляем продажу
    const medicinesJson = JSON.stringify(medicines);
    const quantitiesJson = JSON.stringify(quantities);

    const query = `
      UPDATE sales
      SET saleDate = ?, medicines = ?, quantities = ?, totalAmount = ?
      WHERE id = ?
    `;

    db.run(query, [saleDate, medicinesJson, quantitiesJson, totalAmount, id], function(err) {
      if (err) {
        console.error("Ошибка при обновлении продажи:", err.message);
        return res.status(500).json({ error: err.message });
      }

      // Вычитаем новые количества
      medicines.forEach((medicineId) => {
        db.run(
          "UPDATE medicines SET quantity = quantity - ? WHERE id = ?",
          [quantities[medicineId], medicineId]
        );
      });

      res.json({
        id: Number(id),
        saleDate,
        medicines,
        quantities,
        totalAmount
      });
    });
  });
});

app.delete('/api/sales/:id', (req, res) => {
  const { id } = req.params;

  // Сначала получаем данные о продаже
  db.get("SELECT * FROM sales WHERE id = ?", [id], (err, sale) => {
    if (err) {
      console.error("Ошибка при получении данных о продаже:", err.message);
      return res.status(500).json({ error: err.message });
    }

    if (!sale) {
      return res.status(404).json({ error: "Продажа не найдена" });
    }

    const medicines = JSON.parse(sale.medicines);
    const quantities = JSON.parse(sale.quantities);

    // Возвращаем количества в наличие
    medicines.forEach((medicineId) => {
      db.run(
        "UPDATE medicines SET quantity = quantity + ? WHERE id = ?",
        [quantities[medicineId], medicineId]
      );
    });

    // Удаляем продажу
    db.run("DELETE FROM sales WHERE id = ?", [id], function(err) {
      if (err) {
        console.error("Ошибка при удалении продажи:", err.message);
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: "Продажа удалена", id });
    });
  });
});

// Обработчики для supplies
app.get('/api/supplies', (req, res) => {
  db.all("SELECT * FROM supplies", (err, rows) => {
    if (err) {
      console.error("Ошибка при получении данных о поставках:", err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.post('/api/supplies', (req, res) => {
  const { supplyNumber, supplyDate, medicineList, quantity, supplier } = req.body;
  if (!supplyNumber) {
    return res.status(400).json({ error: "Номер поставки обязателен" });
  }
  const query = `
    INSERT INTO supplies (supplyNumber, supplyDate, medicineList, quantity, supplier)
    VALUES (?, ?, ?, ?, ?)
  `;
  db.run(query, [supplyNumber, supplyDate, medicineList, quantity, supplier], function(err) {
    if (err) {
      console.error("Ошибка при добавлении поставки:", err.message);
      return res.status(500).json({ error: err.message });
    }
    const newSupply = {
      id: this.lastID,
      supplyNumber,
      supplyDate,
      medicineList,
      quantity,
      supplier
    };
    res.json(newSupply);
  });
});

app.put('/api/supplies/:id', (req, res) => {
  const { id } = req.params;
  const { supplyNumber, supplyDate, medicineList, quantity, supplier } = req.body;
  const query = `
    UPDATE supplies
    SET supplyNumber = ?, supplyDate = ?, medicineList = ?, quantity = ?, supplier = ?
    WHERE id = ?
  `;
  db.run(query, [supplyNumber, supplyDate, medicineList, quantity, supplier, id], function(err) {
    if (err) {
      console.error("Ошибка при обновлении поставки:", err.message);
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "Поставка не найдена" });
    }
    res.json({ id: Number(id), supplyNumber, supplyDate, medicineList, quantity, supplier });
  });
});

app.delete('/api/supplies/:id', (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM supplies WHERE id = ?", [id], function(err) {
    if (err) {
      console.error("Ошибка при удалении поставки:", err.message);
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "Поставка не найдена" });
    }
    res.json({ message: "Поставка удалена", id });
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