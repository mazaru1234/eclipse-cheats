# Деплой Eclipse Cheats на eclipse-cheats.ru

Инструкция для переноса проекта на VPS (Ubuntu/Debian). Два варианта: **Docker** (проще) или **bare metal** (Node + nginx + PM2/systemd).

---

## Перед деплоем

### 1. DNS

| Запись | Значение |
|--------|----------|
| `A` `@` | IP вашего сервера |
| `A` `www` | IP вашего сервера (или CNAME на `@`) |

Канонический домен: **https://eclipse-cheats.ru** (без `www`).

### 2. Секреты

Сгенерируйте новые ключи (не используйте dev-значения):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Platega

В личном кабинете Platega укажите webhook:

```
https://eclipse-cheats.ru/api/payments/platega/webhook
```

Return URL формируется из `NEXT_PUBLIC_APP_URL` автоматически.

---

## Переменные окружения

```bash
cp .env.production.example .env.production
nano .env.production
```

Обязательно заполните:

| Переменная | Пример |
|------------|--------|
| `NEXT_PUBLIC_APP_URL` | `https://eclipse-cheats.ru` |
| `JWT_SECRET` | мин. 32 символа |
| `AES_SECRET_KEY` | 64 hex-символа |
| `ADMIN_EMAIL` | ваш email |
| `ADMIN_PASSWORD` | надёжный пароль |
| `PLATEGA_MERCHANT_ID` | UUID из Platega |
| `PLATEGA_SECRET` | секрет API |
| `DATABASE_URL` | `/app/data/eclipse.db` (Docker) или `/var/lib/eclipse-cheats/eclipse.db` |

---

## Вариант A — Docker (рекомендуется)

### На сервере

```bash
# Установка Docker (если нет)
curl -fsSL https://get.docker.com | sh

# Клонирование проекта
git clone <repo-url> /opt/eclipse-cheats
cd /opt/eclipse-cheats

cp .env.production.example .env.production
nano .env.production

docker compose build
docker compose up -d
```

Приложение слушает `127.0.0.1:3000`. База и загрузки — в Docker volumes (`eclipse-data`, `eclipse-uploads`).

### nginx + SSL

```bash
sudo mkdir -p /var/www/certbot
sudo apt install nginx certbot python3-certbot-nginx -y
sudo cp deploy/nginx/eclipse-cheats.ru.conf /etc/nginx/sites-available/eclipse-cheats.ru
sudo ln -sf /etc/nginx/sites-available/eclipse-cheats.ru /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# HTTP-only config first — certbot adds HTTPS itself
sudo certbot --nginx -d eclipse-cheats.ru -d www.eclipse-cheats.ru
sudo nginx -t && sudo systemctl reload nginx
```

> Не используйте `eclipse-cheats.ru.ssl.conf` до выпуска сертификата — там уже прописаны пути к `/etc/letsencrypt/...`, которых ещё нет.

> Если nginx отдаёт `/uploads/` с диска, смонтируйте volume:  
> `docker volume inspect eclipse-cheats_eclipse-uploads` → bind mount в nginx alias.

Или проще: уберите блок `location /uploads/` из nginx — тогда файлы отдаёт Next.js через proxy.

### Обновление

```bash
cd /opt/eclipse-cheats
git pull
docker compose build
docker compose up -d
```

### Бэкап

```bash
bash deploy/backup.sh
# DATA_DIR=/var/lib/docker/volumes/eclipse-cheats_eclipse-data/_data
```

---

## Вариант B — Bare metal (Node + PM2)

### 1. Зависимости

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx certbot python3-certbot-nginx sqlite3
sudo npm install -g pm2
```

### 2. Сборка

```bash
git clone <repo-url> /opt/eclipse-cheats-src
cd /opt/eclipse-cheats-src
cp .env.production.example .env.production
nano .env.production

bash deploy/build-standalone.sh
```

### 3. Env для systemd/PM2

```bash
sudo mkdir -p /etc/eclipse-cheats /var/lib/eclipse-cheats
sudo cp .env.production /etc/eclipse-cheats/env
sudo chmod 600 /etc/eclipse-cheats/env
```

В `/etc/eclipse-cheats/env`:

```env
DATABASE_URL=/var/lib/eclipse-cheats/eclipse.db
```

### 4. PM2

```bash
cd /var/www/eclipse-cheats
pm2 start deploy/ecosystem.config.cjs
pm2 save
pm2 startup
```

Или systemd:

```bash
sudo cp deploy/eclipse-cheats.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now eclipse-cheats
```

### 5. nginx + SSL

Как в варианте A. Для uploads укажите:

```nginx
location /uploads/ {
    alias /var/www/eclipse-cheats/public/uploads/;
}
```

---

## Проверка после деплоя

- [ ] https://eclipse-cheats.ru открывается
- [ ] Вход в админку работает
- [ ] Загрузка картинок товара сохраняется
- [ ] Platega webhook отвечает 200 (тест из кабинета)
- [ ] Пополнение баланса возвращает на `/profile/topup?status=success`
- [ ] Cookies `Secure` (только HTTPS)

---

## Что хранить на диске

| Путь | Содержимое |
|------|------------|
| `data/eclipse.db` | SQLite база (+ `-wal`, `-shm`) |
| `public/uploads/` | Загруженные изображения |

Делайте регулярный бэкап обоих каталогов (`deploy/backup.sh`).

---

## Частые проблемы

**500 после деплоя** — проверьте `JWT_SECRET`, `AES_SECRET_KEY`, права на `data/`.

**Platega не зачисляет** — webhook URL, `PLATEGA_SECRET`, заголовки `X-MerchantId` / `X-Secret`.

**NEXT_PUBLIC_APP_URL не задан** — в production приложение выбросит ошибку при создании платежа.

**better-sqlite3** — собирайте на том же OS/архитектуре, что и сервер (не копируйте `node_modules` с Windows).

---

## Структура deploy-файлов

```
deploy/
  nginx/eclipse-cheats.ru.conf   # reverse proxy + SSL
  ecosystem.config.cjs           # PM2
  eclipse-cheats.service         # systemd
  build-standalone.sh            # сборка без Docker
  backup.sh                      # бэкап БД и uploads
Dockerfile
docker-compose.yml
.env.production.example
```
