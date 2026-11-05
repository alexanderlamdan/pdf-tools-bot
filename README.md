# PDF Tools Bot

## Русский

PDF Tools Bot — Telegram-бот для работы с PDF. Я разрабатывал его около года, постепенно расширяя возможности и доводя обработку больших файлов до предела, который позволяла платформа Telegram.

### Зачем я публикую код

Я открываю код для публичного использования, изучения, обучения, знакомства с устройством проекта и создания форков. Бот закрывается и больше не будет работать в Telegram. Я публикую его как завершённую главу проекта и как пример того, как можно построить большой сервис вокруг ограничений платформы.

Код бота написан мной. Тексты кнопок, сообщений и других пользовательских фраз я создавал с помощью ИИ: ChatGPT и Claude 4.5. ИИ помогал именно с текстами интерфейса, а не писал код проекта.

### Что я хотел показать

- Как можно объединить знания системного администратора, Linux и серверной инфраструктуры в одном продукте.
- Как я старался соблюдать собственные принципы приватности пользователей.
- Как я выжимал возможности PDF-бота, пока не упёрся в ограничения Telegram.

Бот работал через Telegram Bot API Server (Local Bot API), собранный с помощью clang-22 на Debian Sid. Я уделял особое внимание защите данных и приватности пользователей.

### Масштаб и возможности

По моей статистике, у бота было около 200 пользователей, примерно 120 из них были активными. Около 70 пользователей каждый месяц загружали по 300–600 PDF-файлов каждый. Бот обрабатывал файлы размером вплоть до лимита Telegram — около 1 999 МБ.

Я считаю, что по возможностям и нагрузке это был один из самых сильных PDF-ботов в экосистеме Telegram. По моему опыту, у него не было прямых конкурентов с таким сочетанием функций и лимитов. Это моя оценка проекта, а не независимое сравнение рынка.

### Что опубликовано и что останется закрытым

В этом репозитории опубликован код Telegram-бота. Код PDF-worker не публикуется: его разработка продолжается в LMDN PDF — новом продукте, который сейчас находится в разработке и получит улучшенную и расширенную обработку PDF.

В LMDN PDF переходит функциональность бота и дальнейшее развитие проекта. Worker — отдельная часть этой системы и моё ключевое техническое преимущество; его реализация останется закрытой.

Также я не публикую:

- конфигурации systemd для worker и другие серверные конфигурации;
- серверные скрипты проверки и сканирования файлов;
- внутреннее устройство sandbox и изоляции файлов пользователей;
- детали защитных механизмов, применявшихся до попадания файла на сервер.

Я не раскрываю эти материалы, чтобы не публиковать внутреннее устройство серверной защиты и worker.

### Форки и использование

Вы можете изучать код, учиться на нём, создавать форки и развивать собственную версию. Перед публикацией я добавлю файл `LICENSE` с условиями использования и распространения. До этого момента этот README описывает мои намерения, но не заменяет лицензию.

## English

PDF Tools Bot is a Telegram bot for working with PDF files. I spent about a year developing it, gradually expanding its features and pushing large-file processing as far as Telegram allowed.

### Why I am publishing the code

I am opening the code for public use, study, learning, and forking. The bot is shutting down and will no longer operate on Telegram. I am publishing it as a finished chapter of the project and as an example of building a large service around platform limits.

I wrote the bot's code myself. I used AI tools — ChatGPT and Claude 4.5 — to write the button labels, messages, and other user-facing text. AI helped with interface copy only; it did not write the project code.

### What I wanted to show

- How system administration, Linux, and server knowledge can come together in one product.
- How I tried to follow my own principles for protecting user privacy.
- How far I pushed a PDF bot before reaching Telegram's platform limits.

The bot ran through the Telegram Bot API Server (Local Bot API), compiled with clang-22 on Debian Sid. I paid special attention to data protection and user privacy.

### Scale and capabilities

According to my records, the bot had about 200 users, with around 120 active users. About 70 users each uploaded 300–600 PDF files per month. The bot processed files up to Telegram's file-size limit — about 1,999 MB.

I consider it one of the most powerful PDF bots in the Telegram ecosystem in terms of features and workload. In my experience, I did not find a direct competitor with the same combination of features and limits. This is my assessment of the project, not an independent market comparison.

### What is public and what remains private

This repository contains the Telegram bot code. The PDF worker code will not be published. Its development continues as part of LMDN PDF, a new product currently in development that will bring improved and expanded PDF processing.

The bot's functionality and future development are moving to LMDN PDF. The worker is a separate part of that system and my key technical advantage; its implementation will remain private.

I am also not publishing:

- systemd configuration for the worker or other server configuration;
- server scripts used to check and scan files;
- the internal design of the sandbox and user-file isolation;
- details of the protections applied before a file reached the server.

I am keeping these materials private so I do not expose the internal design of the server protections or the worker.

### Forks and use

You are welcome to study the code, learn from it, create forks, and develop your own version. Before publication, I will add a `LICENSE` file with the terms for use and distribution. Until then, this README describes my intent but does not replace a license.
