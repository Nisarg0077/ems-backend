-- -------------------------------------------------
-- 1. Create and use the database
-- -------------------------------------------------
CREATE DATABASE IF NOT EXISTS ems;
USE ems;

-- -------------------------------------------------
-- 2. Departments table
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS departments (
  id        INT PRIMARY KEY,
  name      VARCHAR(100) NOT NULL,
  location  VARCHAR(100)
);

-- Use INSERT IGNORE (or ON DUPLICATE KEY UPDATE) to avoid duplicate-key errors
INSERT IGNORE INTO departments (id, name, location) VALUES
(1, 'Human Resources', 'Head Office'),
(2, 'Finance',         'Head Office'),
(3, 'IT',              'Tech Park'),
(4, 'Marketing',       'Downtown'),
(5, 'Operations',      'Industrial Area');


-- -------------------------------------------------
-- 3. Employees table
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS employees (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  first_name    VARCHAR(100) NOT NULL,
  last_name     VARCHAR(100) NOT NULL,
  email         VARCHAR(150) UNIQUE NOT NULL,
  phone         VARCHAR(20),
  department_id INT,
  position      VARCHAR(100),
  salary        DECIMAL(10,2),
  hire_date     DATE,
  status        ENUM('Active', 'Inactive') DEFAULT 'Active',
  FOREIGN KEY (department_id) REFERENCES departments(id)
);

INSERT IGNORE INTO employees (
  first_name, last_name, email, phone, department_id,
  position, salary, hire_date, status
) VALUES
('Nisarg', 'Limbachiya', 'nisarg.l@ems.com', '9876543210', 3,
 'Software Engineer', 65000.00, '2022-03-15', 'Active'),

('Priya',  'Patel',      'priya.p@ems.com',   '9898989898', 1,
 'HR Executive',     40000.00, '2021-11-20', 'Active'),

('Amit',   'Shah',       'amit.s@ems.com',    '9753124680', 2,
 'Accountant',       55000.00, '2020-09-05', 'Active'),

('Rina',   'Mehta',      'rina.m@ems.com',    '9123456789', 4,
 'Marketing Lead',   60000.00, '2019-06-10', 'Active'),

('Jay',    'Thakkar',    'jay.t@ems.com',     '9001234567', 5,
 'Operations Manager',75000.00, '2018-01-25', 'Inactive');

-- -------------------------------------------------
-- 4. Users table (for login / roles)
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  username   VARCHAR(100) UNIQUE NOT NULL,
  password   VARCHAR(255) NOT NULL,          -- store hashed passwords in production!
  role       ENUM('Admin','HR','Manager') DEFAULT 'HR',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT IGNORE INTO users (username, password, role) VALUES
('admin',        'admin123', 'Admin'),
('hr_priya',     'hr123',    'HR'),
('manager_jay',  'manager123','Manager');


CREATE TABLE IF NOT EXISTS auth_cookies (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  cookie_value VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
