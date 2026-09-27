# Tiktiki — Real Online Database + Real Video Upload

This version uses Supabase for:
- Email/password authentication
- Online PostgreSQL database
- Public video storage
- Real video upload and playback
- User profiles

## 1. Create a Supabase project
Go to https://supabase.com/ and create a project.

## 2. Create the database and storage
In Supabase open **SQL Editor**, paste the complete contents of `supabase-schema.sql`, and click Run.

## 3. Get project keys
Supabase: **Project Settings → API**. Copy the Project URL and the publishable/anon key.

## 4. Configure Tiktiki
In the Tiktiki project folder, copy:
`.env.local.example` → `.env.local`

Put your values in `.env.local`:
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...

Do NOT put a service_role/secret key in this project.

## 5. Install and run
Open Command Prompt inside this folder:

npm install
npm run dev

Open http://localhost:3000

## 6. Signup/login
Create an account. If Supabase email confirmation is enabled, confirm the email before logging in.

## 7. Upload
Log in → Create → Select a video → Publish video. The file goes to Supabase Storage and the video row goes into PostgreSQL.

### Important
This is a real backend architecture, but before public launch you should add moderation, rate limits, reporting, private/admin controls, thumbnails/transcoding, virus/content checks, and stronger production monitoring.


## If the browser says `ERR_NAME_NOT_RESOLVED` / `DNS_PROBE_FINISHED_NXDOMAIN`

That is not a Tiktiki code or API-key error. The Supabase project URL itself is not resolving. Open the Supabase Dashboard → Project Overview. If the project is paused, click **Resume project** and wait until it is active, then restart `npm run dev`. Do not change the project URL to the `/rest/v1/` API URL.

## Google Login

In Supabase → Authentication → Providers → Google, enable Google and enter the Google OAuth Client ID/Secret. In Google Cloud Console add this redirect URI:

`https://YOUR-PROJECT.supabase.co/auth/v1/callback`

For local Tiktiki, the app redirects back to `http://localhost:3000` after Google authentication.


## Real Video Upload + Feed

1. In Supabase open **SQL Editor** and run `supabase-schema.sql` once.
2. Make sure `.env.local` contains `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
3. Run `npm install` then `npm run dev`.
4. Sign in to Tiktiki.
5. Press **Create**, choose a video, write a caption, and press **Publish video**.
6. The video is uploaded to the public `videos` Storage bucket and a row is created in the `videos` table.
7. The home feed reads the newest rows from the online Supabase database and plays the stored video URL.

### If upload is rejected
Run the SQL file again so the `videos` bucket and Storage RLS policies are created. Also make sure the signed-in account exists in `auth.users`.
