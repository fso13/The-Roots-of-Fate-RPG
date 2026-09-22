# PDF The Edge! (new_pdf)

Сборка: `npm run pdf:new`

| Файл | Содержание |
|------|------------|
| `kniga-igroka.pdf` | Книга игрока (A5) |
| `kniga-hranitelya.pdf` | Книга хранителя (A5) |
| `polnoe-izdanie.pdf` | Игрок + хранитель + модули: магия, огнестрел, транспорт, нуар |
| `list-personazha.pdf` | Лист персонажа (A5 бланк) |
| `modules/*.pdf` | Пакы модулей (Gothic, Skyrim, Elden Ring, Homm3…) |
| `adventures/*.pdf` | Приключения отдельно |

Сайт подхватывает эти файлы в `public/new_pdf/` при `npm run build`.

Обложка и задник книг — **full-bleed** (без белых полей). Внутренние страницы — с полями под колонтитул.
