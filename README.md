## Description

This is a users CRUD backend where I apply what I've learned about unit and integration testing.

It's used by this react app:
https://github.com/moebz/user-crud-react

## Generating the test database used in the integration tests

The script example for generating the test database is located in testDatabaseGeneration/generateTestingDatabase.sh.example.

### What the script does is:

- Drop the test database (user_crud_test) first
- Generate a sql file (sqlfile.sql) that carries the real database structure and data, and a log file (logfile.txt) in case its needed (both files are ignored by git).
- Import the recently exported .sql file to the test database

### What you need to do:

- Copy the .sh.example file and set the copy's extension to .sh (this .sh file will be ignored by git so the database password isn't saved in the repository).
- Set the database password in the environment variable PGPASSWORD.
- Execute the script with sudo.
