use finanzmoench;

-- insert data into db

SET @household_id = UUID_TO_BIN('11111111-1111-1111-1111-111111111111', 1);
INSERT INTO household (household_id, name, address, postcode, city, currency)
VALUES (@household_id, 'Test Household 1', 'Test Street 1', '12345', 'Test City 1', 'EUR');

SET @position_category_id = UUID_TO_BIN('22222222-2222-2222-2222-222222222222', 1);
INSERT INTO position_category (position_category_id, name, color_code)
VALUES (@position_category_id, 'living', '#FFFFFF');

SET @person_id = UUID_TO_BIN('33333333-3333-3333-3333-333333333333', 1);
INSERT INTO person (person_id, household_id, first_name, last_name, email)
VALUES (@person_id, @household_id, 'Test Person First Name 1', 'Test Person Last Name', 'test@finanzmeonch.com');

INSERT INTO user_auth (person_id, provider, provider_uid)
VALUES (@person_id, 'google', 'google-12345');

SET @cost_id = UUID_TO_BIN('44444444-4444-4444-4444-444444444444', 1);

INSERT INTO cost_item (cost_item_id, household_id, position_category_id, name, `interval`)
VALUES (@cost_id, @household_id, @position_category_id, 'Test Miete', 'monthly');