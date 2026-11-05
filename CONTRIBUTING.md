# Contributing

## Русский

Спасибо, что хотите изучать или развивать PDF Tools Bot.

Бот закрывается и больше не будет работать в Telegram. Этот репозиторий опубликован как архив проекта: для изучения, обучения, ознакомления с кодом и создания форков. Я не обещаю регулярную поддержку или принятие изменений в исходный проект.

### Что можно делать

- Создавать форки и экспериментировать с кодом.
- Исправлять ошибки и улучшать документацию в своей версии.
- Использовать проект как учебный пример системного администрирования, Linux, серверной разработки и работы с ограничениями Telegram.
- Предлагать изменения через pull request, если они относятся к опубликованной части проекта. Я могу рассмотреть их, но не гарантирую ответ или слияние.

### Что нельзя добавлять в публичный репозиторий

- Токены, пароли, API-ключи, webhook-секреты и другие учётные данные.
- Конфигурации серверов и systemd для PDF-worker.
- Код, бинарники или внутренние детали PDF-worker.
- Скрипты серверной проверки и сканирования файлов.
- Детали sandbox и изоляции пользовательских файлов.
- Реальные пользовательские файлы, персональные данные и приватные логи.

Перед отправкой изменений проверьте diff и убедитесь, что в нём нет секретов и личных данных. Не загружайте в репозиторий данные пользователей даже для демонстрации ошибки.

### Авторство и лицензия

Код бота написан мной. Тексты кнопок и сообщений создавались с помощью ChatGPT и Claude 4.5. Публикация кода не означает, что worker или его технологии тоже открыты.

Перед публикацией я добавлю файл `LICENSE` с условиями использования, изменения и распространения кода. До этого момента этот документ описывает мои намерения, но не заменяет лицензию.

## English

Thank you for your interest in studying or extending PDF Tools Bot.

The bot is shutting down and will no longer operate on Telegram. This repository is published as an archive for study, learning, code review, and forking. I do not promise regular maintenance or acceptance of changes into the original project.

### What you can do

- Fork the repository and experiment with the code.
- Fix bugs and improve documentation in your own version.
- Use the project as a learning example for system administration, Linux, server development, and working around Telegram limits.
- Submit a pull request for changes to the public part of the project. I may review it, but I cannot promise a response or a merge.

### Do not add these items to the public repository

- Bot tokens, passwords, API keys, webhook secrets, or other credentials.
- Server or systemd configuration for the PDF worker.
- PDF worker code, binaries, or internal implementation details.
- Server-side file checking and scanning scripts.
- Details of the sandbox or user-file isolation.
- Real user files, personal data, or private logs.

Review your diff before submitting it and make sure it contains no secrets or personal data. Do not upload user data to demonstrate a bug.

### Authorship and license

I wrote the bot code myself. The button labels and messages were created with the help of ChatGPT and Claude 4.5. Publishing this code does not make the worker or its technology public.

Before publication, I will add a `LICENSE` file with the terms for using, modifying, and distributing the code. Until then, this document describes my intent but does not replace a license.
