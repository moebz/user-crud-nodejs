CREATE TABLE public.refresh_token (
	token_value varchar NOT NULL,
	expiry_date timestamp with time zone NOT NULL,
	user_account_id integer NOT NULL,
	CONSTRAINT refresh_token_fk FOREIGN KEY (user_account_id) REFERENCES public.user_account(id)
);

ALTER TABLE public.refresh_token ADD CONSTRAINT refresh_token_un UNIQUE (token_value);