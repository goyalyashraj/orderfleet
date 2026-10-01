-- =============================================================================
-- Database-per-Service Provisioning Script for Order & Delivery Platform
-- =============================================================================

CREATE DATABASE IF NOT EXISTS identity_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS catalog_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS order_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS delivery_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Dedicated application user adhering to least privilege
CREATE USER IF NOT EXISTS 'app_user'@'%' IDENTIFIED BY 'app_password';
CREATE USER IF NOT EXISTS 'app_user'@'localhost' IDENTIFIED BY 'app_password';

GRANT ALL PRIVILEGES ON identity_db.* TO 'app_user'@'%';
GRANT ALL PRIVILEGES ON catalog_db.* TO 'app_user'@'%';
GRANT ALL PRIVILEGES ON order_db.* TO 'app_user'@'%';
GRANT ALL PRIVILEGES ON delivery_db.* TO 'app_user'@'%';

GRANT ALL PRIVILEGES ON identity_db.* TO 'app_user'@'localhost';
GRANT ALL PRIVILEGES ON catalog_db.* TO 'app_user'@'localhost';
GRANT ALL PRIVILEGES ON order_db.* TO 'app_user'@'localhost';
GRANT ALL PRIVILEGES ON delivery_db.* TO 'app_user'@'localhost';

FLUSH PRIVILEGES;
