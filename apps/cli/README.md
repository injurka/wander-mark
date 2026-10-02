# @injurka/wander-mark-cli

CLI tool for building and deploying Wander Mark static sites.

## Install

```bash
npm install --global @injurka/wander-mark-cli
```

Или установите CLI локально в проект и запускайте через `npx`:

```bash
npm install --save-dev @injurka/wander-mark-cli
npx wander-mark --config config.json
```

## Usage

### CLI

```bash
wander-mark --config config.json --deploy
```

### Programmatic API

```typescript
import { loadConfig, runAutoGeneration, runDeploy } from '@injurka/wander-mark-cli'

const config = await loadConfig('config.json')
await runAutoGeneration(config)

// or with deployment:
await runDeploy('user', 'host', '/path', '.output')
```

## Build from source

```bash
npm run build
```

## Конфигурация (`config.json`)

По умолчанию CLI ищет файл `config.json` в директории запуска. Вы можете настроить пути к исходникам Obsidian, папки для билда и перечень обрабатываемых хранилищ (vaults).

Пример `config.json`:

```json
{
  "paths": {
    "sourceNotesRoot": "/mnt/c/Users/evai/Documents/obsidian-mark/",
    "metaSource": "/mnt/c/Users/evai/Documents/obsidian-mark/.obsidian/export/meta",
    "pluginsSource": "/mnt/c/Users/evai/Documents/obsidian-mark/.obsidian/export/plugins",
    "outputContentRoot": "/mnt/c/Users/evai/Documents/obsidian-mark/.output/content",
    "outputMetaRoot": "/mnt/c/Users/evai/Documents/obsidian-mark/.output/meta",
    "outputPluginsRoot": "/mnt/c/Users/evai/Documents/obsidian-mark/.output/plugins"
  },
  "vaults": [
    {
      "sourcePath": "Korean",
      "exportPath": "Korean"
    }
  ],
  "ignore": {
    "folders": [
      "Frame Forge",
      "Drafts"
    ]
  },
  "deploy": {
    "user": "root",
    "host": "92.63.97.81",
    "path": "/root/sources/wander-mark/docker/vault"
  }
}
```

## 🛠 Использование CLI

После установки запускайте `wander-mark`. Инструмент поддерживает передачу аргументов для гибкого управления сборкой и деплоем.

### Базовая сборка

Использует настройки из `config.json` в текущей папке:

```bash
wander-mark
```

### Указать кастомный путь к конфигу

Если конфиг лежит в другом месте, используйте флаг `-c` или `--config`:

```bash
wander-mark -c ./.obsidian/scripts/my-config.json
```

### Сборка + Деплой на сервер

Добавьте флаг `-d` или `--deploy`. Данные сервера возьмутся из секции `"deploy"` вашего `config.json`:

```bash
wander-mark --deploy
```

### Деплой с ручным переопределением сервера

Если в `config.json` нет секции `"deploy"` или вы хотите отправить билд на другой сервер (например, тестовый), вы можете передать данные прямо в консоль:

```bash
wander-mark --deploy --host 192.168.1.100 --user admin --path /var/www/test-vault
```

### Справка

```bash
wander-mark --help
```

---

## Что происходит под капотом во время деплоя?

Если передан флаг `--deploy`, скрипт выполняет следующие шаги автоматически:

1. Подключается по SSH и проверяет/создает директорию `path` на сервере.
2. Собирает папки `content` и `meta` из локальной `.output` в единый архив `payload.tar.gz`.
3. Отправляет архив по SCP на удаленный сервер.
4. Распаковывает архив на сервере и удаляет `payload.tar.gz`.
5. Очищает локальный `payload.tar.gz`.

> **Внимание:** Для работы деплоя без запроса пароля у вас должен быть прокинут SSH-ключ (`~/.ssh/id_rsa.pub`) на целевой сервер.

---

## Структура генерируемой директории (`.output`)

После работы инструмента формируется чистая и изолированная структура, готовая для отдачи статическим сервером или фронтендом:

```text
.output/
├── content/               # Обработанные Markdown файлы и внутренние картинки
│   └── VaultName/         # Папка конкретного хранилища
└── meta/                  # Метаданные для фронтенда
    └── VaultName/
        ├── images/
        │   └── icon.png   # Иконка хранилища (подготавливается заранее в metaSource)
        ├── settings.json  # Настройки базы (название, описание, подключаемые скрипты)
        ├── search.json    # Индекс для полнотекстового поиска
        ├── graph.json     # Ноды и линки для графа (force-directed graph)
        └── backlinks.json # Карта обратных ссылок между статьями
```

<!--
Пример частой команды локального использования:

npx wander-mark -c /home/injurka/Documents/obsidian-mark/.obsidian/export/config.json --deploy --deploy-mode s3

npx wander-mark -c /root/my/wander-mark/vaults-example/.export/config.json

npx wander-mark -c /home/evai/my/wander-mark/vaults-example/.export/config.json
 -->
