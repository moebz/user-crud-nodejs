Generate test database

The script to generate the test database is located in testDatabaseGeneration/generateTestingDatabase.sh.example.

That script copies the database user_crud to user_crud_test.
It should be renamed to a .sh file.
It drops user_crud_test first.
It should be executed with "sudo".
PGPASSWORD should contain the real database password.
It generates a sql file (sqlfile.sql) that carries the db structure and data,
and a log file (logfile.txt) in case its needed.
This files (sqlfile.sql, logfile.txt) are ignored by git.