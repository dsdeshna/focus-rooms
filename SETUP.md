# 🔧 Focus Rooms Setup Guide 

This file is a more heavily expanded subset of the deployment sequence found in the `README.md`. Use this if you are managing the complete pipeline and need to establish everything step-by-step manually! 

We utilize a **Serverless frontend** hosted on **Vercel** and deploy the database and realtime logic entirely to **Supabase Backend API**. Both platforms offer generous free tiers perfect for student projects.

---

## Step 1: Initialize Database Infrastructure (Supabase)

Supabase runs the PostgreSQL Database, the Authentication (managing Google OAuth and Email), and Realtime WebSocket Broadcast logic natively. 

1. Head directly to [Supabase](https://supabase.com). It requires no credit card.
2. Hit **"New Project"**. Name it `Focus Rooms`. Select a region close to where you live. Add a strong master password (you likely won't need to use the raw password itself again).
3. Wait about 3 minutes for databases to provision and become interactive. 
4. Head into your dashboard, click on **SQL Editor** on the left menu (it looks like a terminal block `< />`).
5. Open `supabase-schema.sql` found locally within this repository. **Copy the entire script** into the empty query box and click the **Run** button. 
    > *What did this do? Have a look at your Table Editor! The entire set of Tables (Users, Rooms, Whiteboards) and Row Level Security permissions are now live.*
6. Open your Supabase **Project Settings** (Cog wheel bottom left) and click **API**. You will see:
   * **Project URL**
   * **Project API Keys** (You want `anon`, the public key, NOT the secret one!).

---

## Step 2: Establish Your Environment Locally

Because Focus Rooms interacts with servers, it requires knowledge of where to route its data. This occurs through `.env` environment files which securely bypass uploading sensitive variables back up to GitHub.

1. Ensure you have run `npm install`.
2. Locate `.env.example` in the main folder. Duplicate this file and rename the new copy to **`.env.local`**. 
3. Paste the URL and Anon Key into the text file correctly resembling this structure:
```env
NEXT_PUBLIC_SUPABASE_URL=https://nxyxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1Ni...
```

You are now entirely equipped to develop locally handling live production data!
**Type `npm run dev` in your terminal to begin developing your application!**

---

## Step 3: Deployment Pipeline (GitHub & Vercel)

Vercel acts as our Serverless Node.js executor. It's built specifically for Next.js and operates gracefully. 

1. **Commit to GitHub:** First ensure your local project is actively committed to your GitHub account repository. Ensure you never commit your newly instantiated `.env.local` file!
2. Login to [Vercel](https://vercel.com) using your GitHub account!
3. Upon entering your dashboard: Click **Add New** → select **Project**.
4. The screen will query your GitHub account. Select `Import` on your `focus-rooms` repository.
5. In the final configuration screen before clicking Deploy, click **Environment Variables**. 
   - Add `NEXT_PUBLIC_SUPABASE_URL` and paste the exact URL from earlier. 
   - Add `NEXT_PUBLIC_SUPABASE_ANON_KEY` and paste the exact Anon Key from earlier. 
6. Click **Deploy**.

Vercel will successfully read your `package.json`, compile a Next.js production build, run code optimizations, and spin up a Serverless CDN deployment globally. When finished your dashboard will present you your live `.vercel.app` URL target!

---

## Step 4: Authentication Security Callbacks (Optional Google)

You must tell Supabase which URLs are permitted to send Authentication traffic otherwise malicious fake sites could act as proxy interceptors. 

1. From Supabase locate the **Authentication** tab -> **URL Configuration**. 
2. Ensure your new `https://[project].vercel.app` site allows traffic here!

If implementing Google sign in natively:
1. Open Google Cloud Platform Console. 
2. Create an **OAuth App Consent**.
3. Create new Credentials pulling the ID and Shared Secret. 
4. Copy the Supabase OAuth redirect URL into Googles Authorized redirect URLs. 
5. Copy Google's Client ID & Secret back inside Supabase under **Authentication** -> **Providers** -> Google!

🎉 The entirety of the deployment is successfully linked. You can edit the UI, push to GitHub, and Vercel will aggressively redeploy updating in less than 3 minutes.
