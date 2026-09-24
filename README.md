# Islam UA — iOS-обёртка (Capacitor)

Готовый проект: твой `index.html` + шрифты внутри нативной iOS-оболочки.
Сборка идёт на облачном Mac в Codemagic, билд сам улетает в TestFlight.

## Что внутри

```
www/                 ← само приложение (index.html, fonts/, fonts.css) — офлайн, без Google Fonts
ios/                 ← Xcode-проект (иконка, сплэш, Info.plist уже настроены)
assets/              ← исходники иконки и сплэша
capacitor.config.json
codemagic.yaml       ← инструкция для облачной сборки
docs/index.html      ← политика конфиденциальности (для GitHub Pages)
```

Что уже сделано:
- Bundle ID `ua.islamua.app`, название «Islam UA», версия 1.0
- Иконка и сплэш из логотипа
- Тёмная светлая строка статуса, только портрет, только iPhone (iPad добавим позже, если надо)
- Отступы под «чёлку» и home-indicator
- Текст запроса геолокации (для «Моё местоположение» во времени намаза)
- `ITSAppUsesNonExemptEncryption = false` — TestFlight не будет спрашивать про шифрование

---

## Шаг 1. Залить проект на GitHub

1. Установи **GitHub Desktop** (desktop.github.com), войди в свой аккаунт GitHub.
2. Распакуй архив `islam-ua` в удобную папку, например `C:\Projects\islam-ua`.
3. GitHub Desktop → **File → Add local repository** → выбери папку `islam-ua`.
   Он скажет, что это не репозиторий → жми **create a repository** → **Create Repository**.
4. Слева появится список файлов. Внизу в поле Summary напиши `Initial commit` → **Commit to main**.
5. Кнопка **Publish repository** → сними галочку «Keep this code private» *или оставь* (Codemagic работает с приватными) → **Publish**.

Готово: репозиторий `github.com/<твой-логин>/islam-ua`.

## Шаг 2. Политика конфиденциальности (2 минуты, нужна Apple)

На GitHub в репозитории: **Settings → Pages → Branch: `main`, Folder: `/docs` → Save**.
Через минуту страница будет по адресу `https://<твой-логин>.github.io/islam-ua/` — этот URL вставишь в App Store Connect.

## Шаг 3. Codemagic

1. codemagic.io → **Sign up with GitHub**.
2. Сначала подключи ключ Apple: справа вверху **Teams → Personal Account → Integrations → Developer Portal → Connect**:
   - **App Store Connect API key name:** `Codemagic` (ровно так — это имя стоит в `codemagic.yaml`)
   - **Issuer ID** — из App Store Connect → Пользователи и доступ → Интеграции
   - **Key ID** — оттуда же
   - **API key** — загрузи файл `.p8`
   Save.
3. **Applications → Add application → GitHub → islam-ua → Codemagic YAML** → Finish.
4. На странице приложения выбери workflow **Islam UA — iOS → TestFlight** → **Start new build**.

Первая сборка ~10–15 минут. Codemagic сам создаст сертификат и профиль, соберёт `.ipa` и загрузит в App Store Connect.
Если сборка красная — открой лог, скопируй последние ~40 строк и пришли мне.

## Шаг 4. TestFlight — проверить на своём iPhone

1. На iPhone поставь приложение **TestFlight** из App Store.
2. App Store Connect → Islam UA → вкладка **TestFlight** → билд появится через 5–15 минут после сборки (статус «Обработка» → «Готово»).
3. Раздел **Внутреннее тестирование** → «+» → создай группу, добавь себя → TestFlight на телефоне покажет приложение → Установить.
4. Проверь всё: тесты, аудио букв, время намаза, запрос геолокации. Здесь же сделай **скриншоты** (iPhone 15/16 Pro Max или любой 6,7"/6,9") — они нужны для страницы в сторе, минимум 3, лучше 5–6.

## Шаг 5. Страница в App Store и отправка на ревью

App Store Connect → Islam UA → **Распространение** → версия 1.0:

- **Снимки экрана** — загрузи скриншоты с iPhone.
- **Название:** Islam UA. **Подзаголовок** (до 30 симв.): например «Арабська, Сіра, час намазу».
- **Описание** — 3–5 абзацев, что умеет приложение. **Ключевые слова** — через запятую: `іслам,арабська,алфавіт,намаз,сура,коран,сіра,мусульманин`.
- **URL политики конфиденциальности** — ссылка из шага 2. **URL поддержки** — можно та же.
- **Информация о приложении** (левое меню): категория **Освіта** (Education), вторая — **Довідники** (Reference). Возрастной рейтинг — пройти анкету, везде «нет» → 4+.
- **Конфиденциальность приложения** → «Начать» → **Данные не собираются** (геолокация обрабатывается на устройстве и не передаётся — это не «сбор»).
- **Сборка** → «+» → выбрать билд из TestFlight.
- **Проверка приложения** → контакт для ревью (твой телефон/почта), «Вход не требуется». В заметках для ревьюера напиши по-английски одну строку: *«Offline learning app for the Ukrainian Muslim community: Arabic alphabet, 99 names, dictionary, Sira quiz, surah names, prayer times. Location is optional and used on-device only.»*
- **Бизнес → статус продавца** (DSA для ЕС) — «не являюсь продавцом», если ещё не сделал.

Сохранить → **Добавить для проверки** → **Отправить на проверку**. Ответ обычно за 1–3 дня.

---

## Как выпускать обновления

1. Правишь `www/index.html` (или кладёшь новый файл вместо него).
2. GitHub Desktop → Commit → Push.
3. Хочешь новую версию в сторе — в `ios/App/App.xcodeproj/project.pbxproj` замени обе строки `MARKETING_VERSION = 1.0;` на `1.1` и т.д. (build number Codemagic увеличивает сам).
4. Codemagic → Start new build → билд в TestFlight → в App Store Connect «+» новая версия → выбрать билд → отправить.

## Если что-то пошло не так

- **«No matching profiles found» / ошибки подписи** — проверь, что интеграция в Codemagic называется `Codemagic` и у API-ключа роль App Manager или выше.
- **Билд загрузился, но в TestFlight его нет** — подожди 15 минут, проверь почту: Apple пишет, если билд отклонён автоматикой.
- **Ревью отклонило** — пришли текст отказа, разберём.
