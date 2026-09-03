CREATE DATABASE IF NOT EXISTS finanzmoench;
use finanzmoench;

CREATE TABLE IF NOT EXISTS household (
    household_id BINARY(16) DEFAULT (UUID_TO_BIN(UUID(), 1)) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address VARCHAR(100) NOT NULL,
    postcode VARCHAR(20) NOT NULL,
    city VARCHAR(100) NOT NULL,
    currency CHAR(3) NOT NULL
);

-- position category for income and expenses
CREATE TABLE IF NOT EXISTS position_category (
    position_category_id BINARY(16) DEFAULT (UUID_TO_BIN(UUID(), 1)) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    color_code CHAR(7)
);

-- profile data
CREATE TABLE IF NOT EXISTS person (
    person_id BINARY(16) DEFAULT (UUID_TO_BIN(UUID(), 1)) PRIMARY KEY,
    household_id BINARY(16),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    email VARCHAR(100),
    FOREIGN KEY (household_id) REFERENCES household(household_id) ON DELETE SET NULL
);

-- auth for sso
CREATE TABLE IF NOT EXISTS user_auth(
    auth_id BINARY(16) DEFAULT (UUID_TO_BIN(UUID(), 1)) PRIMARY KEY,
    person_id BINARY(16) NOT NULL,
    provider ENUM('local', 'google', 'github', 'apple') NOT NULL,
    provider_uid VARCHAR(255),
    password_hash VARCHAR(255),
    last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (person_id) REFERENCES person(person_id) ON DELETE CASCADE,
    UNIQUE (provider, provider_uid)
);

-- reoccurring costs
CREATE TABLE IF NOT EXISTS cost_item(
    cost_item_id BINARY(16) DEFAULT (UUID_TO_BIN(UUID(), 1)) PRIMARY KEY,
    household_id BINARY(16) NOT NULL,
    position_category_id BINARY(16),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    `interval` ENUM('daily', 'weekly', 'monthly', 'yearly') NOT NULL,
    FOREIGN KEY (household_id) REFERENCES household(household_id) ON DELETE CASCADE,
    FOREIGN KEY (position_category_id) REFERENCES position_category(position_category_id) ON DELETE SET NULL
);

-- history of items
CREATE TABLE IF NOT EXISTS item_entry(
    item_entry_id BINARY(16) DEFAULT (UUID_TO_BIN(UUID(), 1)) PRIMARY KEY,
    cost_item_id BINARY(16) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    valid_from DATE NOT NULL,
    valid_to DATE, -- if still valid
    note TEXT,
    FOREIGN KEY (cost_item_id) REFERENCES cost_item(cost_item_id) ON DELETE CASCADE
);

-- income, social help etc
CREATE TABLE IF NOT EXISTS income(
    income_id BINARY(16) DEFAULT (UUID_TO_BIN(UUID(), 1)) PRIMARY KEY,
    person_id BINARY(16) NOT NULL,
    position_category_id BINARY(16),
    amount DECIMAL(10, 2) NOT NULL,
    valid_from DATE NOT NULL,
    valid_to DATE,
    FOREIGN KEY (person_id) REFERENCES person(person_id) ON DELETE CASCADE,
    FOREIGN KEY (position_category_id) REFERENCES position_category(position_category_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS transactions (
    transaction_id BINARY(16) DEFAULT (UUID_TO_BIN(UUID(), 1)) PRIMARY KEY,
    person_id BINARY(16) NOT NULL,
    position_category_id BINARY(16),
    amount DECIMAL(10, 2) NOT NULL,
    date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    note TEXT,
    FOREIGN KEY (person_id) REFERENCES person(person_id) ON DELETE CASCADE,
    FOREIGN KEY (position_category_id) REFERENCES position_category(position_category_id) ON DELETE SET NULL
);

commit;