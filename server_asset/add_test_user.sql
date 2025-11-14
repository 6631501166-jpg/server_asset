-- Add test user account
-- Email: user@gmail.com
-- Password: user123
-- Username: user
-- Role: student

INSERT INTO users (email, password, first_name, last_name, ph_num, username, profile_img, role)
VALUES (
    'user@gmail.com',
    '$argon2id$v=19$m=19456,t=2,p=1$XKa1BzpwwSw+5OXuriIfYw$3V8VM7au0MskdIGV28fkERX7BNj7RKySiCnOl4Abvow',
    'Test',
    'User',
    NULL,
    'user',
    'default.png',
    'student'
);

-- Verify the user was added
SELECT uid, email, username, first_name, last_name, role 
FROM users 
WHERE email = 'user@gmail.com';
