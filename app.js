const express = require('express');
const { connectToDb } = require('./db');
const cors = require('cors');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');
const app = express();
const port = 5000;

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

let db;

async function initDB() {
  db = await connectToDb();
  console.log('✅ Database connected globally.');
}
// ✅ Cookie generation
function generateCookieValue() {
  return crypto.randomBytes(16).toString('hex');
}

// ✅ Store cookie
async function storeCookie(userId) {
  const cookieValue = generateCookieValue();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const sql = 'INSERT INTO auth_cookies (user_id, cookie_value, expires_at) VALUES (?, ?, ?)';
  await db.query(sql, [userId, cookieValue, expiresAt]);
  return { cookieValue, expiresAt };
}

app.get('/', (req, res) => {
  res.send('EMS API running...');
});

// ✅ Cookie check
app.post('/cookie-check', async (req, res) => {
  try {
    const cookieValue = req.cookies.auth_cookie;
    if (!cookieValue) return res.status(401).json({ message: 'No cookie found' });

    const [cookies] = await db.query(
      'SELECT * FROM auth_cookies WHERE cookie_value = ? AND expires_at > NOW()',
      [cookieValue]
    );

    if (cookies.length === 0) return res.status(401).json({ message: 'Invalid session' });

    const [users] = await db.query('SELECT * FROM users WHERE id = ?', [cookies[0].user_id]);
    if (users.length === 0) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'Login Successful', user: users[0] });
  } catch (err) {
    console.error('Cookie check error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ Login route
app.post('/login', async (req, res) => {
  try {
    const { user, password } = req.body;
    const [rows] = await db.query('SELECT * FROM users WHERE username = ? AND password = ?', [user, password]);
    if (rows.length === 0) return res.status(401).json({ message: 'Invalid credentials' });

    const { cookieValue, expiresAt } = await storeCookie(rows[0].id);

    res.cookie('auth_cookie', cookieValue, {
      path: '/',
      expires: expiresAt,
      httpOnly: true,
      secure: false,
    });

    res.status(200).json({ message: 'Login Successful', user: rows[0] });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// server.js
app.post('/logout', (req, res) => {
  const cookie = req.cookies.auth_cookie;
  if (cookie) {
    db.query('DELETE FROM auth_cookies WHERE cookie_value = ?', [cookie]);
  }
  res.clearCookie('auth_cookie', { path: '/', httpOnly: true });
  res.json({ message: 'Logged out' });
});

app.post('/count-emp', async (req, res) => {
    const count_emp = 'select * from employees';
    const [count] = await db.query(count_emp);
    if (count === 0){
       console.log("no data found")
    }
    res.json(count.length);
});
app.post('/count-dept', async (req, res) => {
    const count_dept = 'select * from departments';
    const [count] = await db.query(count_dept);
     if (count === 0){
           console.log("no data found")
     }
    res.json(count.length);
});
app.post('/countempstatus', async (req, res) => {
    const count_status_emp = "select * from employees where status = 'Active'";
    const [count] = await db.query(count_status_emp);
     if (count === 0){
           console.log("no Active employee found")
     }
    res.json(count.length);
});
app.post('/api/employeelist', async (req, res) => {
  //  select e.first_name, e.last_name, e.email, d.name as department, e.position, e.hire_date, e.status from employees e join departments d where e.department_id = d.id;
  try{
    const query_emp_list = "select e.id, e.first_name, e.last_name, e.email, d.name as department, e.position, e.hire_date, e.status from employees e join departments d where e.department_id = d.id";
      const [emp_list] = await db.query(query_emp_list);
       if (emp_list === 0){
             console.log("no employee found")
             res.json({maessage: "no employee found"});
       }
      res.json(emp_list);

  }
  catch (err) {

  }
});

app.post('/api/info/employee/:id', async (req, res) => {
  const id = req.params.id;
  if (!id || isNaN(id)) {
    return res.status(400).json({ message: "Invalid employee ID" });
  }

  try {
    // Use prepared statement (parameterized query) → prevents SQL injection
    const query = `
  SELECT 
    e.id,
    e.first_name,
    e.last_name,
    e.email,
    d.name AS department,
    e.position,
    e.hire_date,
    e.status
  FROM employees e
  INNER JOIN departments d ON e.department_id = d.id
  WHERE e.id = ?
`;
    const [rows] = await db.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "No employee found with this ID" });
    }

    // Return the first (and only) row
    res.status(200).json(rows[0]);

  } catch (err) {
    console.error("Error fetching employee:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

app.post('/api/departmentlist', async (req, res) => {
  //  select e.first_name, e.last_name, e.email, d.name as department, e.position, e.hire_date, e.status from employees e join departments d where e.department_id = d.id;
  try{
    const query_dept_list = "select name, location from departments;";
      const [dept_list] = await db.query(query_dept_list);
       if (dept_list === 0){
             console.log("no employee found")
             res.json({maessage: "no employee found"});
       }
      res.json(dept_list);

  }
  catch (err) {

  }
});


app.post('/api/employee/addemployee', async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      email,
      phone,
      department_name,       // ← frontend should send name, not id
      position,
      salary,
      hire_date,
      status = 'Active',
    } = req.body;

    // ────────────────────────────────────────
    // 1. Required fields validation
    // ────────────────────────────────────────
    if (!first_name || !last_name || !email) {
      return res.status(400).json({
        success: false,
        message: 'first_name, last_name and email are required',
      });
    }

    // Optional: very basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
      });
    }

    // ────────────────────────────────────────
    // 2. Find department_id by name (safe)
    // ────────────────────────────────────────
    const [departments] = await db.query(
      'SELECT id FROM departments WHERE name = ?',
      [department_name]
    );

    if (departments.length === 0) {
      return res.status(400).json({
        success: false,
        message: `Department '${department_name}' not found`,
      });
    }

    const department_id = departments[0].id;

    // ────────────────────────────────────────
    // 3. Prepare insert – only known/safe columns
    // ────────────────────────────────────────
    const allowedFields = [
      'first_name', 'last_name', 'email', 'phone',
      'department_id', 'position', 'salary', 'hire_date', 'status'
    ];

    const dataToInsert = {
      first_name,
      last_name,
      email,
      phone: phone || null,
      department_id,
      position: position || null,
      salary: salary ? Number(salary) : null,
      hire_date: hire_date || null,
      status,
    };

    const columns = [];
    const values = [];

    for (const field of allowedFields) {
      if (dataToInsert[field] !== undefined) {
        columns.push(field);
        values.push(dataToInsert[field]);
      }
    }

    if (columns.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields provided',
      });
    }

    const placeholders = columns.map(() => '?').join(', ');
    const query = `INSERT INTO employees (${columns.join(', ')}) VALUES (${placeholders})`;

    // ────────────────────────────────────────
    // 4. Execute
    // ────────────────────────────────────────
    const [result] = await db.query(query, values);

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      employeeId: result.insertId,
    });

  } catch (error) {
    console.error('Add employee error:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'Employee with this email already exists',
      });
    }

    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({
        success: false,
        message: 'Invalid department_id',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create employee',
      error: error.message,
    });
  }
});

// ✅ Start after DB is ready
initDB().then(() => {
  app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
  });
});
