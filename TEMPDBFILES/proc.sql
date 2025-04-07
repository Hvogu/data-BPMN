use test;
select * from employees;

DROP PROCEDURE IF EXISTS temp;
DELIMITER |
create procedure temp()
BEGIN
	-- declare variables
    DECLARE localVar INT DEFAULT 0;
    DECLARE localVar2 INT DEFAULT 0;
    
    -- select into statement with a CASE for each var 
    -- in each CASE there should be a WHEN statement for each user condetion
	select
        case
			WHEN department_id = 2 THEN 2
            ELSE 1
		END AS temp1,
        CASE
			WHEN department_id = 2 THEN 3
            ELSE 1
		END AS temp2
	INTO localVar, localVar2
	FROM orders
    where id = 1;
        
	insert into employees VALUES (1,first_name,0,0,0,'2024-05-05',0,0) ON DUPLICATE KEY UPDATE id = 2, salary = localVar, department_id = localVar2;
END |
DELIMITER ;

DROP PROCEDURE IF EXISTS GetNthPrimaryKey;
DELIMITER |
CREATE PROCEDURE GetNthPrimaryKey(IN n Integer, IN tableName VARCHAR(64), OUT primaryKeyValue INT)
BEGIN

    DECLARE primaryKeyCol VARCHAR(64);
    DECLARE result INT;

    -- Build query to find the name of the primary key
    SET @qry1 = CONCAT(
        'SELECT column_name FROM information_schema.KEY_COLUMN_USAGE ',
        'WHERE table_schema = DATABASE() AND table_name = \'', tableName, '\' ',
        'AND constraint_name = \'PRIMARY\' LIMIT 1'
    );
    
    PREPARE stmt FROM @qry1;
    EXECUTE stmt INTO primaryKeyCol;
    DEALLOCATE PREPARE stmt;

    -- Build query to get the Nth primary key value
    SET @qry2 = CONCAT(
        'SELECT ', primaryKeyCol, ' FROM ', tableName, 
        ' ORDER BY ', primaryKeyCol, ' LIMIT 1 OFFSET ', n
    );
    
    -- Execute query to get nth key and store result in @result
    PREPARE exe FROM @qry2; 
    EXECUTE exe INTO result; 
    DEALLOCATE PREPARE exe;
    
    -- Return nth key
    SET primaryKeyValue = result;
END |
DELIMITER ;

Call GetNthPrimaryKey(1, 'employees', @res);
select @res;

DROP PROCEDURE IF EXISTS BPMNUpdate;
DELIMITER |
CREATE PROCEDURE BPMNUpdate(IN tableName varchar(20)) -- , IN proc varchar(20))
BEGIN  

	-- declare var
    declare counter int default 1;
    declare rowCount int;
    
    -- query to get the num of rows of a table
    SET @qry = CONCAT('SELECT COUNT(*) INTO @rowCount FROM ', tableName, ';');
    
    -- execute query
    PREPARE exe FROM @qry;
    EXECUTE exe;
    deallocate prepare exe;
    
    select @rowCount into rowCount;
    
    select rowCount as numOfRows;
    
    while counter <= rowCount do
		
        set counter = counter + 1;
        select counter as count;
	END WHILE;


END |
DELIMITER ;


CALL BPMNUpdate('employees');


