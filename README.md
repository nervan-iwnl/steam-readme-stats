# Steam Readme Stats / Steam Widget

Сервис для генерации **SVG-виджета по данным Steam**. Виджет рендерится на сервере: мы сами ходим в Steam Web API, собираем профиль и статистику, встраиваем аватар в base64 и отдаём готовую картинку по URL. Это сделано так, чтобы виджет корректно показывался в GitHub README и не зависел от браузера пользователя.

---

## Что умеет

- принимает **SteamID64**, **vanity-ник** (`nervan_lfy`) **или ссылку на профиль**(`https://steamcommunity.com/id/...`, `https://steamcommunity.com/profiles/...`)
- вытягивает:
  - аватар (inline, без внешнего запроса на стороне GitHub)
  - имя профиля
  - уровень Steam
  - количество игр
  - количество друзей
  - последнюю сыгранную игру (с переносом по длине и расширением виджета)
  - статус (online / offline / away)
- поддерживает `?lang=ru|en`
- поддерживает темы: `?theme=dark` (по умолчанию) и `?theme=light` (с отдельной палитрой)
- отдаёт **валидный SVG** даже если Steam API временно не отвечает
- кэширует ответы на ~10 минут в памяти

---

## Установка

```bash
git clone https://github.com/nervan-iwnl/steam-readme-stats.git
cd steam-readme-stats
npm install
```

Создайте файл `.env`:

```env
STEAM_API_KEY=your_steam_api_key
PORT=3000
```

`STEAM_API_KEY` берётся тут: https://steamcommunity.com/dev/apikey

---

## Запуск

```bash
npm start
```

Сервис поднимется на `http://localhost:3000`.

Проверочный эндпоинт:

```text
http://localhost:3000/steam-widget/test
```

он не ходит в Steam и нужен только для просмотра макета.

---

## Основной эндпоинт

```text
GET /steam-widget
```

### Параметры

| Параметр                   | Описание                                                                                                      |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `steamid` / `id` / `profile` | Любая форма идентификатора: ID64, vanity или полная ссылка на профиль |
| `lang`                           | `ru` или `en` (по умолчанию `en`)                                                                 |
| `theme`                          | `dark` (по умолчанию) или `light`                                                                   |
| `title`                          | Принудительное отображаемое имя вместо того, что лежит в Steam        |
| `width`                          | Принудительная ширина SVG                                                                         |

Если идентификатор не распознан — вернётся рабочий SVG с заглушкой (`Profile not found`), а не 500.

---

## Примеры

**1. По чистому SteamID64:**

```text
http://localhost:3000/steam-widget?steamid=76561198801977286
```

**2. По vanity:**

```text
http://localhost:3000/steam-widget?steamid=nervan_lfy
```

**3. По ссылке на профиль:**

```text
http://localhost:3000/steam-widget?steamid=https://steamcommunity.com/id/nervan_lfy/
```

**4. Русская локаль + светлая тема:**

```text
http://localhost:3000/steam-widget?steamid=76561198801977286&lang=ru&theme=light
```

**5. Кастомный заголовок:**

```text
http://localhost:3000/steam-widget?steamid=76561198801977286&title=Gigachad
```

---

## Пример для профиля 

```markdown
<p align="center">
  <img src="https://your-vercel-app.vercel.app/steam-widget?steamid=https://steamcommunity.com/id/nervan_lfy/&lang=ru&theme=dark" alt="Steam widget" />
</p>
```

или короче:

```markdown
![Steam](https://your-vercel-app.vercel.app/steam-widget?steamid=nervan_lfy)
```

---

## Пример как выглядит

**1. Дефолтная версия**

<p align="center">
  <img src="https://steam-readme-stats-taupe.vercel.app/steam-widget?steamid=76561198801977286&lang=en" alt="Steam Widget">
</p>

**2. Русская, светлая версия**

<p align="center">
  <img src="https://steam-readme-stats-taupe.vercel.app/steam-widget?steamid=76561198801977286&lang=ru&theme=light&" alt="Steam Widget">
</p>

---

## Деплой на Vercel

1. Импортируйте репозиторий.
2. В настройках проекта добавьте переменную окружения:

   ```text
   STEAM_API_KEY=your_steam_api_key
   ```
3. Нажмите Deploy.

После этого конечная точка будет доступна по:

```text
https://<project>.vercel.app/steam-widget?steamid=...
```

---

## Структура проекта

```text
.
├── server.js                  # запуск express
├── src
│   ├── routes
│   │   └── widgetRoute.js     # HTTP-эндпоинты
│   ├── services
│   │   └── steamService.js    # вызовы Steam API, кэш, resolve vanity/url → id64, avatar inline
│   └── render
│       ├── renderTemplate.js  # подстановка данных в SVG, темы
│       ├── svgText.js         # расчёт ширины, переносы строк
│       └── strings.js         # ru/en
└── templates
    └── widgetTemplate.svg     # базовый шаблон
```

---

## Заметки

- GitHub любит кешировать картинки. Если хотите всегда свежую версию — добавляйте мусорный параметр:
  ```markdown
  ![Steam](https://.../steam-widget?steamid=nervan_lfy&ts=1730400000)
  ```
- В светлой теме цвета подбираются под светлый фон (`#f3f4f6`), в тёмной — под `#141321`.
- Если Vercel начнёт спать, GitHub может показать старую версию — это норм для динамических SVG.

---

---
