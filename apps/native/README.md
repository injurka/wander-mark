# wander-mark Desktop (Tauri 2)

Команды из корня репозитория:

```sh
bun install
bun run dev:native
bun run build:linux
```

`build:native` собирает приложение для текущей платформы. `build:linux` явно
использует `x86_64-unknown-linux-gnu` и создаёт deb, rpm и AppImage в
`apps/native/src-tauri/target/x86_64-unknown-linux-gnu/release/bundle/`.

Требуются Rust/Cargo и системные зависимости Tauri 2 для Linux: WebKitGTK 4.1,
GTK 3, OpenSSL, librsvg, patchelf и инструменты компиляции. Для сборки нужны
доступ к crates.io и загрузка инструментов упаковки AppImage.

Клиент собирается отдельно в `apps/client/dist-tauri`. Конфигурация сервера
загружается по существующему URL из клиента; переопределение — через
`VITE_CONFIG_URL` при сборке. `config/server.json` по-прежнему описывает
сервер и хранилища.

В режиме Tauri PWA/Service Worker отключены, скачанные медиа читаются напрямую
из OPFS. SQLite/OPFS требуют поддержки соответствующих API в системном
WebKitGTK; успешная компиляция не проверяет синхронизацию и офлайн-чтение
в запущенном приложении.

При push тега GitLab запускает `build_native_linux`. Тег должен содержать
SemVer, например `v2.7.13` или `2.7.13`: версия передаётся Tauri через
временный конфиг. Пакеты `wander-mark` доступны в артефактах job 30 дней.
Деплой через Portainer ожидает успешного завершения Linux-сборки.
Runner с тегом `docker` должен поддерживать Linux x64 Docker images,
иметь доступ к Debian packages, crates.io и GitHub releases.

В GitHub Actions тот же push тега запускает job `Build Tauri Linux` в
`Build & Deploy`. deb, rpm и AppImage доступны в артефакте
`wander-mark-linux-x64-<tag>` в течение 30 дней.
