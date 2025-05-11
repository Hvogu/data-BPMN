create database JobApplication;
use JobApplication;

-- Create CV table
CREATE TABLE CV (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    jobExperience INT,
    current_position VARCHAR(100)
);

-- Insert sample data into CV table
INSERT INTO CV (name, jobExperience, current_position) VALUES 
('Alice Johnson', 5, 'Software Developer'),
('Bob Smith', 3, 'Data Analyst'),
('Carol Lee', 7, 'Project Manager'),
('David Kim', 2, 'QA Tester'),
('Emma Brown', 4, 'UX Designer');

-- Create Candidates table
CREATE TABLE Candidates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    score INT,
    CV_id INT,
    qualification VARCHAR(100),
    FOREIGN KEY (CV_id) REFERENCES CV(id)
);

-- Create Offers table
CREATE TABLE Offers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    CV_id INT,
    FOREIGN KEY (CV_id) REFERENCES CV(id)
);
select * from cv;
select * from candidates;
delete from candidates where id>2;
select * from offers;