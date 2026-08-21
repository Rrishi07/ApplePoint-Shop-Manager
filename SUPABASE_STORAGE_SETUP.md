# ApplePoint Supabase Storage setup

Render environment variables:

- SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
- SUPABASE_SECRET_KEY=your sb_secret_... key
- SUPABASE_STORAGE_BUCKET=product-images

The `product-images` bucket must be public because accessory cards display images directly through public CDN URLs.
The secret key is used only by the FastAPI backend and must never be placed in frontend env files or committed to GitHub.
