CREATE TABLE public.user_account (
	id SERIAL PRIMARY KEY,
	firstname varchar NULL,
	lastname varchar NULL,
	email varchar NULL,
	username varchar NULL,
	passwd varchar NULL,
	avatar_url varchar NULL,
	CONSTRAINT user_email_un UNIQUE (email),
	CONSTRAINT user_username_un UNIQUE (username)
);