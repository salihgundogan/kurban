# Kurbanlık Satış ve Takip Sistemi

Kurban bayramı için büyükbaş ve küçükbaş hayvan satışlarını takip eden web uygulaması.

## 🚀 Kurulum

1. Projeyi klonlayın
2. Bağımlılıkları yükleyin:
```bash
npm install
```

3. `.env` dosyası oluşturun ve Firebase bilgilerinizi ekleyin:
```bash
cp .env.example .env
```

4. `.env` dosyasını düzenleyip kendi Firebase bilgilerinizi girin

5. Geliştirme sunucusunu başlatın:
```bash
npm run dev
```

## 📦 Netlify'a Deploy

### Adım 1: GitHub'a Push
```bash
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/KULLANICI_ADINIZ/REPO_ADINIZ.git
git push -u origin main
```

### Adım 2: Netlify'da Ayarlar

1. [Netlify](https://netlify.com) hesabınıza giriş yapın
2. "Add new site" > "Import an existing project" seçin
3. GitHub repository'nizi seçin
4. Build ayarları:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`

### Adım 3: Environment Variables Ekleme

Netlify dashboard'da:
1. Site Settings > Environment Variables
2. Aşağıdaki değişkenleri ekleyin:

```
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

3. "Deploy site" butonuna basın

## 🔒 Güvenlik

- Firebase API anahtarları `.env` dosyasında saklanır
- `.env` dosyası Git'e commit edilmez
- Production ortamında Netlify environment variables kullanılır

## 📱 Özellikler

- Hayvan ekleme/düzenleme/silme
- Hisse satışı ve takibi
- Ödeme takibi
- WhatsApp entegrasyonu
- Real-time güncellemeler
- Mobil uyumlu tasarım

## 🛠️ Teknolojiler

- React 19
- Vite
- Firebase Firestore
- TailwindCSS
- React Router
- React Icons
