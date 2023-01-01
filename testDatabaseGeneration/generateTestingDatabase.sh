#!/bin/bash
# This script copies the database user_crud to user_crud_test.
# It drops user_crud_test first.
# It should be executed with "sudo".
sudo systemctl restart postgresql
sudo -u postgres -i psql -c "drop database user_crud_test;"
sudo -u postgres -i psql -c "create database user_crud_test;"
PGPASSWORD="123456" pg_dump -U postgres -h localhost user_crud > sqlfile.sql
PGPASSWORD="123456" psql -U postgres -h localhost -d user_crud_test -f sqlfile.sql -L logfile.txt