const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3000;
const DB_PATH = path.join(__dirname, 'visitors.db');

// initialize sqlite db
const db = new sqlite3.Database(DB_PATH, err => {
    if (err) return console.error(err.message);
  });
  
  // ensure statements run in order
  db.serialize(() => {
    // create table if it doesn't exist
    db.run(
      `CREATE TABLE IF NOT EXISTS counter (
        id    INTEGER PRIMARY KEY CHECK (id = 1),
        count INTEGER NOT NULL
      );`
    );
    // insert the single row if it's not there yet
    db.run(
      `INSERT OR IGNORE INTO counter (id, count)
       VALUES (1, 0);`
    );
  });
  

// serve static files
app.use(express.static(path.join(__dirname, 'public')));

// visitor-count endpoint
app.get('/api/count', (req, res) => {
  db.serialize(() => {
    db.run(`UPDATE counter SET count = count + 1 WHERE id = 1`);
    db.get(`SELECT count FROM counter WHERE id = 1`, (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
       // if for some reason row is missing, default to zero
       const count = row?.count ?? 0;
       res.json({ count });
    });
  });
});

// start the server
app.listen(PORT, () => {
  console.log(`Legacy resume site running at http://localhost:${PORT}`);
});
