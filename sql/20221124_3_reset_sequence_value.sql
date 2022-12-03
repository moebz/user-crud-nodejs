-- MARK: SET SEQUENCE TO CURRENT MAX VALUE
SELECT setval('user_account_id_seq', (SELECT max(id) FROM user_account));