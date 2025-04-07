DROP PROCEDURE IF EXISTS BulkUpdate;
DELIMITER |
CREATE PROCEDURE BulkUpdate()
BEGIN
DECLARE done INT DEFAULT FALSE;
DECLARE row_order_date date;
DECLARE row_order_id int;
DECLARE row_product_id int;
DECLARE row_quantity int;

DECLARE curs CURSOR FOR SELECT order_date, order_id, product_id, quantity FROM orders ORDER BY order_id, product_id;

DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
OPEN curs;

read_loop: LOOP
FETCH curs INTO row_order_date, row_order_id, row_product_id, row_quantity;
IF done THEN
LEAVE read_loop;
END IF;

CASE
WHEN row_order_id = 1 and row_product_id = 101 THEN INSERT INTO orders (order_date, order_id, product_id, quantity) VALUES (row_order_date, row_order_id, row_product_id, row_quantity) ON DUPLICATE KEY UPDATE quantity = 1;
ELSE INSERT INTO orders (order_date, order_id, product_id, quantity) VALUES (row_order_date, row_order_id, row_product_id, row_quantity) ON DUPLICATE KEY UPDATE order_date = row_order_date, order_id = row_order_id, product_id = row_product_id, quantity 
= row_quantity;
END CASE;
END LOOP;
CLOSE curs;

END |
 DELIMITER ;
 
 call bulkUpdate();
 
 SELECT *
FROM orders;
