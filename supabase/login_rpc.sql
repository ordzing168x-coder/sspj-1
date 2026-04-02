-- รันใน Supabase: SQL Editor → New query → Run
-- สร้าง role ในตาราง auth ให้ชื่อตรงกับที่ใช้ในโค้ด: master, admin, user
-- ตัวอย่าง:
-- insert into auth (auth_name) values ('master'), ('admin'), ('user') on conflict do nothing;

drop function if exists public.login_user(text, text);

create or replace function public.login_user(p_username text, p_password text)
returns table (
  user_id integer,
  user_fname text,
  user_lname text,
  user_uname text,
  auth_name text,
  rank_name text,
  user_pin text
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
    a.auth_name,
    r.rank_name,
    u.user_pin
  from app_user u
  join "auth" a on a.auth_id = u.auth_id
  left join "rank" r on r.rank_id = u.rank_id
  where u.user_uname = p_username
    and u.user_pw = p_password
  limit 1;
end;
$$;

grant execute on function public.login_user(text, text) to anon, authenticated;
