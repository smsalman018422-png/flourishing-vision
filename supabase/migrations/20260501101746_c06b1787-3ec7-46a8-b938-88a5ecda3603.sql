-- Reset password for seosalman53@gmail.com to 'Salman1@'
update auth.users
set encrypted_password = crypt('Salman1@', gen_salt('bf')),
    updated_at = now()
where email = 'seosalman53@gmail.com';

-- Ensure client_profile exists
insert into public.client_profiles (id, email, full_name, is_active)
values ('24931ed2-b720-4755-813b-1591a0b1d042', 'seosalman53@gmail.com', 'Salman', true)
on conflict (id) do update set is_active = true, email = excluded.email;