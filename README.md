# 🌸 Focus Rooms

A collaborative focus room web application where people can join rooms, share whiteboards, play ambient sounds, talk via mic, and take personal notes — all wrapped in a dreamy, Tumblr-inspired pastel aesthetic.

**Built for:** Cloud Computing + Software Patterns courses  
**Deployment:** AWS EKS (Kubernetes) with Docker containerization and Prometheus/Grafana monitoring

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔐 **Authentication** | Email/password + Google OAuth sign-in via Supabase Auth |
| 🚪 **Room System** | Create rooms with shareable 6-character codes, join with a code |
| 🎵 **Sound Generators** | White, pink, and brown noise generators (Web Audio API) |
| 🎚️ **Frequency Slider** | Tunable sine wave generator (20Hz–2000Hz) with preset frequencies |
| 🌧️ **Ambient Sounds** | Rain, café, forest, ocean, fireplace, wind |
| 🎤 **Voice Chat** | Toggle mic for real-time voice communication (WebRTC peer-to-peer) |
| 🎨 **Collaborative Whiteboard** | Draw together with color picker and adjustable brush sizes |
| 📥 **Save Whiteboard** | Download the whiteboard as a PNG image |
| 📝 **Sticky Notes** | Personal, translucent, draggable notes visible only to you |
| 🔔 **Notifications** | Toast notifications when someone opens whiteboard or joins |
| 👥 **Participant List** | Zoom-style list with mic on/off indicators |
| 🖼️ **Custom Backgrounds** | Upload a background image for the room |
| 🎨 **8 Color Themes** | Switch between 8 distinct pastel themes (Strategy Pattern) |
| ⚙️ **Account Settings** | Edit display name, link Instagram/LinkedIn/GitHub |
| 📊 **Monitoring** | Prometheus metrics + Grafana dashboards for observability |

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 (App Router) + React 19 + TypeScript |
| Styling | Tailwind CSS + Custom CSS (glassmorphism, animations) |
| Fonts | Playfair Display + Lora (Google Fonts) |
| Auth | Supabase Auth (email + Google OAuth) |
| Database | Supabase PostgreSQL |
| Real-time | Supabase Realtime (Broadcast + Presence) |
| Voice | WebRTC (peer-to-peer) with Supabase signaling |
| Whiteboard | Fabric.js (HTML5 Canvas) |
| Audio | Web Audio API (noise generators, oscillator) |
| Containerization | Docker (multi-stage build) |
| Orchestration | Kubernetes (AWS EKS) |
| Monitoring | Prometheus + Grafana |
| CI/CD | GitHub Actions → AWS ECR → EKS |
| Metrics | prom-client (Node.js Prometheus client) |

---

## 🧩 Design & Cloud Patterns

This project implements **6 software design patterns** and **4 cloud computing / DevOps patterns**. Every pattern is clearly marked in the code with comments.

See [`PATTERNS.md`](./PATTERNS.md) for a complete guide to all patterns with file locations.

| # | Pattern | Type |
|---|---------|------|
| 1 | Observer | Software — Behavioral |
| 2 | Factory | Software — Creational |
| 3 | Strategy | Software — Behavioral |
| 4 | Repository | Software — Structural |
| 5 | Singleton | Software — Creational |
| 6 | Command | Software — Behavioral |
| 7 | Containerization (Docker) | DevOps / Cloud |
| 8 | Container Orchestration (Kubernetes) | DevOps / Cloud |
| 9 | Monitoring & Observability (Prometheus + Grafana) | DevOps / Cloud |
| 10 | Event-Driven Architecture | Cloud Architecture |

---

## 🚀 Getting Started (Local Development)

### Prerequisites

- **Node.js** 18+ installed ([download](https://nodejs.org))
- **npm** (comes with Node.js)
- A **Supabase** account (free tier: [supabase.com](https://supabase.com))
- (Optional) **Docker Desktop** for local container testing

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/cloud-com-soft-patterns.git
cd cloud-com-soft-patterns
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Once created, go to **Settings → API** and copy:
   - `Project URL` → this is your `NEXT_PUBLIC_SUPABASE_URL`
   - `anon / public` key → this is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Go to **SQL Editor** → click **New Query**
4. Paste the entire contents of [`supabase-schema.sql`](./supabase-schema.sql) and click **Run**
5. This creates all tables, RLS policies, and triggers

### Step 4: Configure Environment Variables

```bash
# Copy the example env file
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 5: (Optional) Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Go to **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**
4. Set **Authorized redirect URIs** to:
   - `https://your-project-id.supabase.co/auth/v1/callback`
5. Copy the **Client ID** and **Client Secret**
6. In the Supabase Dashboard, go to **Authentication → Providers → Google**
7. Enable Google and paste the Client ID and Client Secret

### Step 6: Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🐳 Docker (Local Container Testing)

### Build and Run the Docker Image

```bash
# Build the image
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key \
  -t focus-rooms .

# Run the container
docker run -p 3000:3000 focus-rooms
```

Open [http://localhost:3000](http://localhost:3000) — you're now running in a container!

### Verify Health & Metrics

```bash
# Health check (used by Kubernetes probes)
curl http://localhost:3000/api/health

# Prometheus metrics endpoint
curl http://localhost:3000/api/metrics
```

---

## ☁️ AWS Deployment Guide

This section walks you through deploying Focus Rooms to AWS from scratch.

### Accounts You Need to Create

| Service | URL | What it's for | Cost |
|---------|-----|---------------|------|
| **AWS** | [aws.amazon.com](https://aws.amazon.com) | ECR (container registry), EKS (Kubernetes) | Free tier available; EKS ~$0.10/hr per cluster |
| **Supabase** | [supabase.com](https://supabase.com) | Database, Auth, Realtime | Free tier (500MB DB, 50K MAU) |
| **GitHub** | [github.com](https://github.com) | Source code + CI/CD via Actions | Free |
| **Docker Hub** _(optional)_ | [hub.docker.com](https://hub.docker.com) | Docker Desktop download | Free |

### Step 1: Install Required CLI Tools

You need these tools installed on your machine:

```bash
# 1. Install AWS CLI
# Download from: https://aws.amazon.com/cli/
# After install, verify:
aws --version

# 2. Install kubectl (Kubernetes CLI)
# Download from: https://kubernetes.io/docs/tasks/tools/
# After install, verify:
kubectl version --client

# 3. Install eksctl (EKS cluster management)
# Download from: https://eksctl.io/installation/
# After install, verify:
eksctl version

# 4. Install Docker Desktop
# Download from: https://www.docker.com/products/docker-desktop/
docker --version
```

### Step 2: Configure AWS Account

```bash
# Create an AWS account at https://aws.amazon.com if you haven't already.
# Then create an IAM user with programmatic access:
#   1. Go to AWS Console → IAM → Users → Create User
#   2. Give it a name like "focus-rooms-deployer"
#   3. Attach these policies:
#      - AmazonEC2ContainerRegistryFullAccess
#      - AmazonEKSClusterPolicy
#      - AmazonEKSWorkerNodePolicy
#      - AmazonEKS_CNI_Policy
#      - AmazonEKSServicePolicy
#   4. Create access keys (Access Key ID + Secret Access Key)

# Configure AWS CLI with your credentials:
aws configure
# It will prompt for:
#   AWS Access Key ID:     <paste your access key>
#   AWS Secret Access Key: <paste your secret key>
#   Default region name:   ap-south-1    (or your preferred region)
#   Default output format: json
```

### Step 3: Create ECR Repository (Container Registry)

```bash
# Create a repository to store your Docker images
aws ecr create-repository \
  --repository-name focus-rooms \
  --region ap-south-1

# Note the repositoryUri from the output — it looks like:
# 123456789012.dkr.ecr.ap-south-1.amazonaws.com/focus-rooms
```

### Step 4: Create EKS Cluster (Kubernetes)

```bash
# This creates a Kubernetes cluster on AWS (takes ~15-20 minutes)
eksctl create cluster \
  --name focus-rooms-cluster \
  --region ap-south-1 \
  --nodegroup-name focus-rooms-nodes \
  --node-type t3.medium \
  --nodes 2 \
  --nodes-min 1 \
  --nodes-max 3 \
  --managed

# Verify the cluster is ready:
kubectl get nodes
# You should see 2 nodes in "Ready" state
```

### Step 5: Install the AWS Load Balancer Controller

The Ingress resource requires the AWS ALB controller:

```bash
# Add the EKS Helm chart repo
helm repo add eks https://aws.github.io/eks-charts
helm repo update

# Install the AWS Load Balancer Controller
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=focus-rooms-cluster \
  --set serviceAccount.create=true \
  --set serviceAccount.name=aws-load-balancer-controller
```

### Step 6: Build and Push Docker Image

```bash
# Login to ECR
aws ecr get-login-password --region ap-south-1 | \
  docker login --username AWS --password-stdin \
  123456789012.dkr.ecr.ap-south-1.amazonaws.com

# Build the image (replace with your Supabase values)
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key \
  -t 123456789012.dkr.ecr.ap-south-1.amazonaws.com/focus-rooms:latest .

# Push to ECR
docker push 123456789012.dkr.ecr.ap-south-1.amazonaws.com/focus-rooms:latest
```

### Step 7: Update Kubernetes Secrets

```bash
# Edit k8s/secret.yaml with your real base64-encoded values:
# Generate base64 values:
echo -n "https://your-project.supabase.co" | base64
echo -n "your-anon-key" | base64

# Paste the output into k8s/secret.yaml, replacing the placeholders
```

### Step 8: Update the Deployment Image

Edit `k8s/deployment.yaml` and replace the image placeholder:

```yaml
# Change this line:
image: <AWS_ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/focus-rooms:latest
# To your actual ECR URI:
image: 123456789012.dkr.ecr.ap-south-1.amazonaws.com/focus-rooms:latest
```

### Step 9: Deploy Everything to Kubernetes

```bash
# Deploy the application
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/hpa.yaml

# Deploy monitoring stack
kubectl apply -f k8s/monitoring/prometheus-configmap.yaml
kubectl apply -f k8s/monitoring/prometheus-deployment.yaml
kubectl apply -f k8s/monitoring/grafana-datasource-configmap.yaml
kubectl apply -f k8s/monitoring/grafana-deployment.yaml

# Verify everything is running
kubectl get pods -n focus-rooms
kubectl get pods -n monitoring

# Get your application's external URL (ALB DNS)
kubectl get ingress -n focus-rooms
# The ADDRESS column shows your public URL

# Get Grafana's external URL
kubectl get svc grafana-service -n monitoring
# The EXTERNAL-IP column shows the Grafana URL (port 3000)
```

### Step 10: Set Up GitHub Actions (CI/CD)

Add these secrets to your GitHub repository for automated deployments:

1. Go to your GitHub repo → **Settings → Secrets and variables → Actions**
2. Add these repository secrets:

| Secret Name | Value |
|-------------|-------|
| `AWS_ACCESS_KEY_ID` | Your AWS access key |
| `AWS_SECRET_ACCESS_KEY` | Your AWS secret key |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |

Now every push to `main` will automatically build, push, and deploy!

---

## 📊 Monitoring with Prometheus & Grafana

### Accessing Grafana

After deployment, get the Grafana URL:

```bash
kubectl get svc grafana-service -n monitoring
```

Open the EXTERNAL-IP at port 3000. Login with:
- **Username:** `admin`
- **Password:** `admin`

### Creating a Dashboard

1. In Grafana, click **+** → **New Dashboard** → **Add Visualization**
2. Select **Prometheus** as the data source
3. Use these example queries:

| Panel | Prometheus Query | Description |
|-------|-----------------|-------------|
| Request Rate | `rate(http_requests_total[5m])` | Requests per second |
| Request Duration | `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))` | P95 latency |
| Active Rooms | `active_rooms_total` | Current active rooms |
| Memory Usage | `process_resident_memory_bytes` | Node.js memory usage |
| CPU Usage | `rate(process_cpu_seconds_total[5m])` | CPU utilization |
| Event Loop Lag | `nodejs_eventloop_lag_seconds` | Node.js event loop lag |

### Prometheus Metrics Endpoint

The app exposes metrics at `/api/metrics` in Prometheus text format:

```bash
# Test locally
curl http://localhost:3000/api/metrics

# Test on K8s
kubectl port-forward svc/focus-rooms-service 3000:80 -n focus-rooms
curl http://localhost:3000/api/metrics
```

---

## 📁 Project Structure

```
cloud-com-soft-patterns/
├── .github/
│   └── workflows/
│       └── deploy.yml              # CI/CD: Build → ECR → EKS
├── k8s/                            # Kubernetes manifests
│   ├── namespace.yaml              # focus-rooms namespace
│   ├── configmap.yaml              # Non-sensitive env vars
│   ├── secret.yaml                 # Supabase credentials (gitignored)
│   ├── deployment.yaml             # App deployment (2 replicas)
│   ├── service.yaml                # ClusterIP service
│   ├── ingress.yaml                # AWS ALB ingress
│   ├── hpa.yaml                    # Auto-scaler (2-5 pods)
│   └── monitoring/
│       ├── prometheus-configmap.yaml
│       ├── prometheus-deployment.yaml
│       ├── grafana-deployment.yaml
│       └── grafana-datasource-configmap.yaml
├── public/                         # Static assets
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── health/route.ts     # K8s health probe endpoint
│   │   │   └── metrics/route.ts    # Prometheus metrics endpoint
│   │   ├── auth/
│   │   │   ├── login/page.tsx      # Login page
│   │   │   ├── signup/page.tsx     # Signup page
│   │   │   └── callback/route.ts   # OAuth callback
│   │   ├── dashboard/page.tsx      # Create/join rooms
│   │   ├── room/[code]/page.tsx    # Main room experience
│   │   ├── settings/page.tsx       # Account settings
│   │   ├── layout.tsx              # Root layout
│   │   ├── page.tsx                # Landing page
│   │   └── globals.css             # Global styles + themes
│   ├── components/
│   │   ├── room/
│   │   │   ├── AudioPanel.tsx      # Sound controls (Factory)
│   │   │   ├── Whiteboard.tsx      # Collaborative canvas (Command)
│   │   │   ├── ParticipantList.tsx  # Participant list
│   │   │   ├── StickyNotes.tsx     # Personal notes (Repository)
│   │   │   └── NotificationToasts.tsx
│   │   └── theme/
│   │       ├── ThemeProvider.tsx    # Theme context (Strategy)
│   │       └── ThemeSwitcher.tsx    # Theme picker
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts           # Browser client (Singleton)
│   │   │   └── server.ts           # Server client
│   │   ├── audio/
│   │   │   └── SoundFactory.ts     # Factory Pattern
│   │   ├── themes/
│   │   │   └── ThemeStrategy.ts    # Strategy Pattern
│   │   ├── realtime/
│   │   │   └── RealtimeManager.ts  # Observer + Event-Driven
│   │   ├── repositories/           # Repository Pattern
│   │   │   ├── RoomRepository.ts
│   │   │   ├── UserRepository.ts
│   │   │   ├── NoteRepository.ts
│   │   │   └── WhiteboardRepository.ts
│   │   ├── webrtc/
│   │   │   └── PeerManager.ts      # WebRTC P2P connections
│   │   ├── metrics.ts              # Prometheus registry (Singleton)
│   │   ├── utils.ts                # Utility functions
│   │   └── utils/
│   │       └── image.ts            # Image compression
│   ├── middleware.ts                # Auth protection + metrics
│   └── types/
│       └── index.ts                # TypeScript type definitions
├── Dockerfile                      # Multi-stage Docker build
├── .dockerignore                   # Docker build context filter
├── .env.example                    # Environment variable template
├── PATTERNS.md                     # Pattern documentation
├── README.md                       # This file
├── supabase-schema.sql             # Database schema
└── package.json
```

---

## 🎨 Color Themes

| Theme | Colors |
|-------|--------|
| 🌸 Lavender Dream | Soft purple/lilac palette |
| 🌹 Rose Garden | Pink/rose palette |
| 🌊 Ocean Breeze | Cool blue palette |
| 🌿 Sage Meadow | Earthy green palette |
| 🌻 Honey Glow | Warm golden/amber palette |
| 🧡 Sunset Ember | Coral/warm orange palette |
| 🌙 Midnight Muse | Dark navy (dark mode) |
| ☕ Mocha Cream | Warm brown/beige palette |

---

## 🔑 Cloud Services Used

| Service | What it provides | Free tier |
|---------|-----------------|-----------|
| **AWS EKS** | Kubernetes cluster | ~$0.10/hr per cluster |
| **AWS ECR** | Docker container registry | 500MB free storage |
| **Supabase** | Database, Auth, Realtime | 500MB DB, 50K MAU |
| **GitHub Actions** | CI/CD pipeline | 2,000 minutes/month free |
| **Prometheus** | Metrics collection | Open source (self-hosted) |
| **Grafana** | Metrics visualization | Open source (self-hosted) |

---

## 🧹 Useful Commands

```bash
# ── Local Development ──
npm run dev                 # Start dev server
npm run build               # Production build
npm run lint                # Run ESLint

# ── Docker ──
docker build -t focus-rooms .
docker run -p 3000:3000 focus-rooms

# ── Kubernetes ──
kubectl get pods -n focus-rooms            # List app pods
kubectl get pods -n monitoring             # List monitoring pods
kubectl logs -f deployment/focus-rooms -n focus-rooms  # Stream logs
kubectl get hpa -n focus-rooms             # Check autoscaler status
kubectl get ingress -n focus-rooms         # Get public URL

# ── Monitoring ──
kubectl port-forward svc/prometheus-service 9090:9090 -n monitoring   # Prometheus UI
kubectl port-forward svc/grafana-service 3001:3000 -n monitoring      # Grafana UI

# ── Cleanup (delete everything) ──
kubectl delete namespace focus-rooms
kubectl delete namespace monitoring
eksctl delete cluster --name focus-rooms-cluster --region ap-south-1
```
