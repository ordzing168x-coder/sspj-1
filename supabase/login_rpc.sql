-- รันใน Supabase: SQL Editor → New query → Run
-- สร้าง role ในตาราง auth ให้ชื่อตรงกับที่ใช้ในโค้ด: master, admin, user
-- ตัวอย่าง:
-- insert into auth (auth_name) values ('master'), ('admin'), ('user') on conflict do nothing;

create or replace function public.login_user(p_username text, p_password text)
returns table (
  user_id integer,
  user_fname text,
  user_lname text,
  user_uname text,
  auth_name text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    u.user_id,
    u.user_fname,
    u.user_lname,
    u.user_uname,
    a.auth_name
  from app_user u
  join auth a on a.auth_id = u.auth_id
  where u.user_uname = p_username
    and u.user_pw = p_password
  limit 1;
end;
$$;

grant execute on function public.login_user(text, text) to anon, authenticated;
