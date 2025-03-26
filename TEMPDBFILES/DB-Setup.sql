create database test;
use test;

CREATE TABLE departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(100)
);

INSERT INTO departments (name, location) VALUES
('Human Resources', 'New York'),
('Engineering', 'San Francisco'),
('Marketing', 'Los Angeles'),
('Sales', 'Chicago'),
('Finance', 'Boston');

CREATE TABLE employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    hire_date DATE NOT NULL,
    salary DECIMAL(10,2) NOT NULL,
    department_id INT,
    FOREIGN KEY (department_id) REFERENCES departments(id)
);

INSERT INTO employees (first_name, last_name, email, phone, hire_date, salary, department_id) VALUES
('John', 'Doe', 'john.doe@example.com', '123-456-7890', '2023-01-15', 60000.00, 2),
('Jane', 'Smith', 'jane.smith@example.com', '234-567-8901', '2022-05-23', 65000.00, 3),
('Robert', 'Brown', 'robert.brown@example.com', '345-678-9012', '2021-11-10', 70000.00, 1),
('Emily', 'Davis', 'emily.davis@example.com', '456-789-0123', '2020-07-19', 75000.00, 4),
('Michael', 'Johnson', 'michael.johnson@example.com', '567-890-1234', '2019-03-25', 80000.00, 5);

