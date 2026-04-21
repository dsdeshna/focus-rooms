# setup & deployment guide

This guide will walk you through the process of setting up Focus Rooms in your local environment and deploying it to the cloud.

---

## 1. Prerequisites

Before you begin, ensure you have the following accounts and tools ready:
- **Node.js 18+**: [Download here](https://nodejs.org/)
- **Supabase**: A free account at [supabase.com](https://supabase.com)
- **Vercel**: A free account at [vercel.com](https://vercel.com)
- **Git**: For version control.

---

## 2. Supabase Configuration

Focus Rooms relies on Supabase for authentication, database storage, and real-time synchronization.

### create a project
1. Log into your Supabase Dashboard and click **New Project**.
2. Give your project a name and set a secure database password.

### initialize the database
1. Navigate to the **SQL Editor** in the left sidebar.
2. Click **New Query**.
3. Copy the contents of [`supabase-schema.sql`](./supabase-schema.sql) from the root of this repository.
4. Paste the SQL into the editor and click **Run**. This will create the necessary tables and policies.

### retrieve api keys
1. Go to **Project Settings** → **API**.
2. Locate the following variables for later use:
   - `Project URL`
   - `anon / public` key

---

## 3. Local Environment Setup

### clone the repository
```bash
git clone https://github.com/your-username/focus-rooms.git
cd focus-rooms
```

### install dependencies
```bash
npm install
```

### configure environment variables
Create a new file named `.env.local` in the root directory and add the keys you retrieved from Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

### run the application
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to see the application in action.

---

## 4. Deployment on Vercel

### push to github
Initialize a repository and push your local code to GitHub:
```bash
git init
git add .
git commit -m "feat: initial commit"
# follow GitHub's instructions to add a remote and push
```

### connect to vercel
1. Go to your [Vercel Dashboard](https://vercel.com).
2. Click **Add New** → **Project** and import your GitHub repository.
3. In the **Environment Variables** section, add the same two keys:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Click **Deploy**. Vercel will build and host your application, providing you with a live URL.

---

## 5. Troubleshooting

- **WebRTC Issues**: Ensure you are using a modern browser (Chrome, Firefox, Safari). WebRTC requires a secure context (HTTPS), which Vercel provides automatically.
- **Realtime Sync**: If the whiteboard or presence isn't syncing, verify that your Supabase Realtime service is enabled in the project dashboard.
