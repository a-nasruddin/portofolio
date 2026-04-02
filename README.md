# 🚀 Portfolio Website — Hugo + Docker + Kubernetes (K3d)

> Portofolio profesional berbasis Hugo SSG, dikontainerisasi dengan Docker/Nginx, dan di-deploy ke cluster Kubernetes lokal menggunakan K3d.

---

## 📋 Daftar Isi

1. [Struktur Proyek](#struktur-proyek)
2. [Prerequisites](#prerequisites)
3. [Setup Lingkungan WSL2 (Ubuntu)](#setup-lingkungan-wsl2-ubuntu)
   - [Instalasi Hugo Extended](#1-instalasi-hugo-extended)
   - [Instalasi Docker](#2-instalasi-docker)
   - [Instalasi K3d](#3-instalasi-k3d)
   - [Instalasi kubectl](#4-instalasi-kubectl)
4. [Local Development dengan Hugo](#local-development-dengan-hugo)
5. [Kustomisasi Konten](#kustomisasi-konten)
6. [Build Docker Image](#build-docker-image)
7. [Setup Cluster K3d](#setup-cluster-k3d)
8. [Deploy ke Kubernetes](#deploy-ke-kubernetes)
9. [Akses Website di Browser](#akses-website-di-browser)
10. [Update & Re-deploy](#update--re-deploy)
11. [Cleanup](#cleanup)
12. [Troubleshooting](#troubleshooting)

---

## 📁 Struktur Proyek

```
portfolio/
├── config.toml                   # Konfigurasi Hugo
├── content/
│   ├── _index.md                 # Konten homepage (Hero, About, Skills, Contact)
│   └── blog/
│       └── first-post.md         # Draft artikel pertama
├── themes/
│   └── devops-minimal/           # Custom theme (dark DevOps aesthetic)
│       ├── layouts/              # Template HTML Hugo
│       ├── static/
│       │   ├── css/main.css      # Stylesheet utama
│       │   └── js/main.js        # Particle animation, typing effect, dll.
│       └── theme.toml
├── Dockerfile                    # Multi-stage build (Hugo → Nginx Alpine)
├── nginx.conf                    # Konfigurasi Nginx
├── k8s/
│   ├── deployment.yaml           # Kubernetes Deployment (2 replicas)
│   └── service.yaml              # Kubernetes NodePort Service (:30080)
└── README.md
```

---

## ✅ Prerequisites

| Tool | Versi Minimum | Cek Instalasi |
|------|--------------|---------------|
| Docker Engine (via WSL2) | 24.x+ | `docker --version` |
| K3d | 5.x+ | `k3d --version` |
| kubectl | 1.28+ | `kubectl version --client` |
| Hugo Extended | 0.110+ | `hugo version` |

> Semua instalasi di bawah dilakukan **di dalam terminal WSL2 (Ubuntu)**.

---

## 🐧 Setup Lingkungan WSL2 (Ubuntu)

Buka terminal **WSL2 Ubuntu** kamu, lalu ikuti langkah-langkah berikut.

### 1. Instalasi Hugo Extended

Hugo di apt repository Ubuntu biasanya outdated. Install manual dari GitHub releases:

```bash
# Set versi Hugo yang diinginkan
HUGO_VERSION=0.124.1

# Download Hugo Extended untuk Linux AMD64
wget -q "https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_extended_${HUGO_VERSION}_linux-amd64.tar.gz" \
  -O /tmp/hugo.tar.gz

# Ekstrak dan install ke /usr/local/bin
tar -xzf /tmp/hugo.tar.gz -C /tmp
sudo mv /tmp/hugo /usr/local/bin/hugo
sudo chmod +x /usr/local/bin/hugo
rm /tmp/hugo.tar.gz

# Verifikasi — pastikan ada kata "extended"
hugo version
```

Output yang diharapkan:
```
hugo v0.124.1-xxx+extended linux/amd64 BuildDate=...
```

---

### 2. Instalasi Docker

Ada **dua opsi**. Pilih salah satu:

#### Opsi A — Docker Desktop for Windows + WSL2 Integration (Rekomendasi)

Jika Docker Desktop for Windows sudah terinstall di Windows:

1. Buka **Docker Desktop** di Windows
2. Masuk ke **Settings → Resources → WSL Integration**
3. Aktifkan integrasi untuk distro Ubuntu kamu
4. Klik **Apply & Restart**
5. Buka terminal WSL2, verifikasi:
   ```bash
   docker --version
   docker ps
   ```

#### Opsi B — Docker Engine Langsung di WSL2

```bash
# Update package list
sudo apt-get update

# Install dependensi
sudo apt-get install -y \
  ca-certificates curl gnupg lsb-release

# Tambahkan Docker GPG key
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Tambahkan Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin

# Jalankan Docker daemon dan tambahkan user ke group docker
sudo service docker start
sudo usermod -aG docker $USER
newgrp docker

# Verifikasi
docker --version
docker run --rm hello-world
```

> **Catatan:** Di WSL2 dengan Opsi B, Docker daemon mungkin perlu distart manual setiap sesi:
> ```bash
> sudo service docker start
> ```
> Atau tambahkan ke `~/.bashrc` / `~/.zshrc`:
> ```bash
> echo "sudo service docker start > /dev/null 2>&1" >> ~/.bashrc
> ```

---

### 3. Instalasi K3d

```bash
# Install K3d via official install script
curl -s https://raw.githubusercontent.com/k3d-io/k3d/main/install.sh | bash

# Verifikasi
k3d --version
```

---

### 4. Instalasi kubectl

```bash
# Download kubectl binary
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"

# Install ke PATH
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
rm kubectl

# Verifikasi
kubectl version --client
```

---

## 💻 Local Development dengan Hugo

```bash
# Masuk ke folder proyek (sesuaikan path-nya)
# Jika proyek ada di Windows filesystem, akses lewat /mnt/c/
cd /mnt/c/Users/LAPTOP/.gemini/antigravity/scratch/portfolio

# Atau, salin proyek ke home WSL2 untuk performa lebih baik:
cp -r /mnt/c/Users/LAPTOP/.gemini/antigravity/scratch/portfolio ~/portfolio
cd ~/portfolio

# Jalankan Hugo dev server
hugo server -D
```

> ⚡ **Tip Performa:** Hugo dan Git bekerja jauh lebih cepat jika proyek ada di filesystem WSL2 (`~/portfolio`) dibanding Windows filesystem (`/mnt/c/...`). Sangat disarankan untuk menyalin proyek ke home dir WSL2.

**Buka di browser Windows:**
```
http://localhost:1313
```

WSL2 secara otomatis mem-forward port ke Windows, sehingga `localhost` di Windows = `localhost` di WSL2.

---

## ✏️ Kustomisasi Konten

Edit file **`content/_index.md`** — bagian front matter (antara `---`) untuk mengubah semua konten:

| Section | Parameter | Keterangan |
|---------|-----------|------------|
| Hero | `hero.firstName`, `hero.lastName` | Nama kamu |
| Hero | `hero.roles` | List role untuk typing animation |
| Hero | `hero.description` | Tagline singkat |
| About | `about.paragraphs` | Paragraf tentang dirimu |
| Stats | `stats` | Angka-angka statistik |
| Skills | `skills` | Kategori & tools |
| Contact | `contact.email`, `contact.github`, `contact.linkedin` | Info kontak |

### Tambah Blog Post Baru

```bash
hugo new blog/nama-artikel.md
```

---

## 🐳 Build Docker Image

```bash
# Pastikan di root folder proyek
cd ~/portfolio   # atau path proyek kamu

# Build image
docker build -t portfolio:latest .

# Verifikasi image
docker images portfolio

# Test lokal (opsional)
docker run --rm -p 8080:80 portfolio:latest
# Buka: http://localhost:8080
```

---

## ☸️ Setup Cluster K3d

```bash
# Buat cluster dengan port forwarding NodePort 30080
k3d cluster create portfolio-cluster \
  --port "30080:30080@server:0" \
  --agents 1

# Verifikasi cluster
k3d cluster list
kubectl get nodes
```

Output yang diharapkan:
```
NAME                              STATUS   ROLES                  AGE
k3d-portfolio-cluster-server-0   Ready    control-plane,master   30s
k3d-portfolio-cluster-agent-0    Ready    <none>                 25s
```

```bash
# Pastikan kubectl terhubung ke K3d
kubectl config current-context
# Output: k3d-portfolio-cluster
```

---

## 🚢 Deploy ke Kubernetes

```bash
# 1. Import Docker image ke dalam K3d cluster
k3d image import portfolio:latest -c portfolio-cluster

# 2. Apply semua manifests sekaligus
kubectl apply -f k8s/

# 3. Pantau status pods
kubectl get pods -w
# Tunggu hingga STATUS = Running (1/1)
```

```bash
# Verifikasi deployment & service
kubectl get deployment portfolio
kubectl get service portfolio-service
```

Output service yang diharapkan:
```
NAME                TYPE       CLUSTER-IP      EXTERNAL-IP   PORT(S)        AGE
portfolio-service   NodePort   10.43.xxx.xxx   <none>        80:30080/TCP   30s
```

---

## 🌐 Akses Website di Browser

Buka browser di **Windows** (bukan di WSL2) dan akses:

```
http://localhost:30080
```

> ✅ Ini langsung bekerja karena WSL2 secara otomatis mem-forward port dari WSL2 ke Windows. Tidak perlu konfigurasi tambahan.

Verifikasi via curl di terminal WSL2:
```bash
curl -sI http://localhost:30080
# HTTP/1.1 200 OK
```

---

## 🔄 Update & Re-deploy

Alur kerja setelah mengubah konten atau code:

```bash
# 1. Rebuild Docker image
docker build -t portfolio:latest .

# 2. Import ulang ke K3d (wajib!)
k3d image import portfolio:latest -c portfolio-cluster

# 3. Restart pods agar pakai image baru
kubectl rollout restart deployment/portfolio

# 4. Pantau proses rollout
kubectl rollout status deployment/portfolio
```

---

## 🗑️ Cleanup

```bash
# Hapus K8s resources
kubectl delete -f k8s/

# Hapus K3d cluster
k3d cluster delete portfolio-cluster

# Hapus Docker image
docker rmi portfolio:latest
```

---

## 🔍 Troubleshooting

### ❌ `Cannot connect to the Docker daemon`
```bash
# Start Docker daemon (Opsi B — Docker Engine di WSL2)
sudo service docker start

# Atau untuk Docker Desktop: pastikan WSL integration aktif
```

### ❌ Pod status `ErrImageNeverPull` atau `ImagePullBackOff`
```bash
# Image belum diimport ke K3d
k3d image import portfolio:latest -c portfolio-cluster
kubectl rollout restart deployment/portfolio
```

### ❌ `localhost:30080` tidak bisa diakses dari Windows browser
```bash
# Cek apakah cluster dibuat dengan port forwarding
k3d cluster list

# Jika tidak ada --port mapping, hapus dan buat ulang:
k3d cluster delete portfolio-cluster
k3d cluster create portfolio-cluster \
  --port "30080:30080@server:0" \
  --agents 1
```

### ❌ Hugo server lambat saat proyek ada di `/mnt/c/`
```bash
# Salin proyek ke filesystem WSL2
cp -r /mnt/c/Users/LAPTOP/.gemini/antigravity/scratch/portfolio ~/portfolio
cd ~/portfolio
hugo server -D
```

### ❌ `hugo: command not found`
```bash
# Verifikasi instalasi
which hugo
ls -la /usr/local/bin/hugo

# Reinstall jika perlu
HUGO_VERSION=0.124.1
wget -q "https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_extended_${HUGO_VERSION}_linux-amd64.tar.gz" -O /tmp/hugo.tar.gz
tar -xzf /tmp/hugo.tar.gz -C /tmp
sudo mv /tmp/hugo /usr/local/bin/hugo
```

### 🔍 Debug K8s
```bash
# Lihat logs pod
kubectl get pods
kubectl logs <nama-pod>

# Describe pod untuk event detail
kubectl describe pod <nama-pod>

# Masuk ke dalam pod
kubectl exec -it <nama-pod> -- sh
```

---

## 📦 Tech Stack

| Component | Technology |
|-----------|-----------|
| Static Site Generator | Hugo Extended |
| Theme | Custom `devops-minimal` |
| Web Server | Nginx Alpine |
| Containerization | Docker (multi-stage build) |
| Container Orchestration | Kubernetes via K3d |
| Runtime Environment | WSL2 Ubuntu |

---

*Generated with ❤️ for DevOps/SRE/Cloud Engineers*
