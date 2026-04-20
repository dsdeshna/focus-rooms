# 🚀 Complete Step-by-Step Deployment Guide: Focus Rooms

This guide assumes **zero prior knowledge**. Follow these steps exactly, one by one, to get Focus Rooms live on the internet using Supabase (Backend) and Vercel (Frontend).

---

## Part 1: Setting up the Backend (Supabase)

Supabase handles your database, user accounts, and real-time features.

1.  **Create an Account:**
    *   Go to [Supabase.com](https://supabase.com).
    *   Click **Start your project** or **Sign Up**. You can use your GitHub account to sign in easily.
2.  **Create a Project:**
    *   Once logged in, click **New Project**.
    *   Select an **Organization** (usually your name).
    *   **Name:** `Focus Rooms`
    *   **Database Password:** Click **Generate a password**. **IMPORTANT:** Copy this password and save it somewhere safe (like a Note app).
    *   **Region:** Choose the one closest to you (e.g., *Mumbai* if you are in India).
    *   **Pricing Plan:** Keep it on the **Free** tier.
    *   Click **Create new project**. Wait 2-3 minutes for it to finish setting up.
3.  **Run the Database Script:**
    *   In your Supabase dashboard, look at the left sidebar and click on **SQL Editor** (it looks like `>_`).
    *   Click **New Query**.
    *   Go to your project files on your computer and open the file named `supabase-schema.sql`.
    *   Select all the text inside that file and **Copy** it.
    *   Go back to the Supabase SQL Editor and **Paste** the text into the query box.
    *   Click the **Run** button (bottom right). You should see a message saying "Success".
4.  **Copy your API Keys:**
    *   On the left sidebar, click the **Settings** cog wheel (bottom left).
    *   Click on **API**.
    *   You will see **Project URL**. Copy this URL. You will need it in Part 2.
    *   Under **Project API Keys**, find the row that says `anon` / `public`. Copy this long string of characters. You will need it in Part 2.

---

## Part 2: Local Project Setup

Now we prepare the code on your computer to talk to your new Supabase backend.

1.  **Open the Project:**
    *   Open your code editor (like VS Code) and open the folder containing this project.
2.  **Install Dependencies:**
    *   Open your terminal (in VS Code, go to **Terminal -> New Terminal**).
    *   Type `npm install` and press Enter. Wait for it to finish.
3.  **Configure Environment Variables:**
    *   In the file list on the left, find `.env.example`.
    *   Right-click it and select **Rename**. Rename it to `.env.local`.
    *   Open `.env.local`.
    *   Find `NEXT_PUBLIC_SUPABASE_URL=` and paste your **Project URL** after the `=` sign.
    *   Find `NEXT_PUBLIC_SUPABASE_ANON_KEY=` and paste your **anon / public** key after the `=` sign.
    *   Save the file (`Ctrl + S` or `Cmd + S`).
4.  **Test Locally (Optional but Recommended):**
    *   In the terminal, type `npm run dev`.
    *   Open your browser and go to `http://localhost:3000`.
    *   If you see the landing page, everything is working! Stop the server by pressing `Ctrl + C` in the terminal.

---

## Part 3: Deploying to the Cloud (Vercel)

Vercel puts your website on the live internet.

1.  **Push to GitHub:**
    *   Go to [GitHub.com](https://github.com) and create a **New Repository**. Name it `focus-rooms`.
    *   Follow the instructions on GitHub to push your code. If you are using VS Code, use the "Source Control" tab on the left to "Publish to GitHub".
2.  **Import to Vercel:**
    *   Go to [Vercel.com](https://vercel.com).
    *   Sign up/Login using your GitHub account.
    *   Click **Add New...** -> **Project**.
    *   You should see your `focus-rooms` repository in the list. Click **Import**.
3.  **Add Environment Variables to Vercel:**
    *   Before you click "Deploy", look for the **Environment Variables** section and click it to expand.
    *   **Name:** `NEXT_PUBLIC_SUPABASE_URL`
    *   **Value:** Paste your Supabase Project URL.
    *   Click **Add**.
    *   **Name:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    *   **Value:** Paste your Supabase `anon` / `public` key.
    *   Click **Add**.
4.  **Deploy:**
    *   Click **Deploy**.
    *   Wait about 1 minute. Once you see fireworks 🎇, your site is live! Vercel will give you a link (e.g., `https://focus-rooms.vercel.app`).

---

## Part 4: Final Authentication Security (Crucial!)

You must tell Supabase that your new Vercel website is allowed to log users in.

1.  **Back to Supabase:**
    *   Go back to your Supabase Dashboard.
    *   On the left sidebar, click **Authentication** (the user icon).
    *   Click on **URL Configuration**.
    *   In the **Site URL** box, paste your Vercel website link (e.g., `https://focus-rooms-yourname.vercel.app`).
    *   In the **Redirect URLs** section, click **Add URL**.
    *   Paste your Vercel link followed by `/auth/callback`. Example: `https://focus-rooms-yourname.vercel.app/auth/callback`.
    *   Click **Save**.

---

## Troubleshooting FAQ

*   **"I get a 404 error when logging in":** Check Part 4. You probably haven't added your Vercel URL to the Supabase Site URL settings.
*   **"The whiteboard doesn't sync":** Ensure you ran the SQL script in Part 1, Step 3. That script enables "Realtime" which is required for syncing.
*   **"My images won't upload":** Profiles are created automatically on signup. If you want to upload background images, you can do so in the Room settings via a URL or by manually creating a "Bucket" in the Supabase **Storage** tab named `backgrounds` and setting it to "Public".

**You are all set! Your collaborative focus room is now ready for the world. 🌸**
