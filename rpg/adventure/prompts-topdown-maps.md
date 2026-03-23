# Промпты для иллюстраций «Стеклянный звон»

*Готовые запросы для нейросетей (**Midjourney**, **DALL·E**, **Stable Diffusion**, **Flux**, **Ideogram** и др.). Сгенерируйте **PNG**, положите в [`maps/`](maps/) с именами ниже — тогда они подхватятся в [приключении](01-steklyannyy-zvon.md) и на сайте.*

**Общие советы**

- Для **карты поля боя** (вид сверху): добавляйте к промпту: `top-down view, battle map, tactical grid optional, no characters or empty for tokens, fantasy rpg, high detail, atmospheric lighting`.
- **Соотношение сторон:** для стола удобно **16:9** или **4:3**; для квадратного баттлмата — **1:1**.
- Если модель **искажает текст** на карте — просите `no text, no letters` и подписывайте локации сами.
- **Негатив** (где есть): `blurry, low resolution, isometric 3/4 view, side view, people standing in scene`.

---

## 1. Карта города «Серый причал»

**Файл после генерации:** `maps/01-gorod-seryy-prichal.png`

### Русский промпт

```
Вид сверху, иллюстрированная карта фэнтези-прибрежного города, река широкая вертикально по центру делит город пополам, старая каменная церковь с колокольней на восточном берегу, деревянный мост и каменная запруда внизу по течению, складские кварталы, рыночная площадь, таверна с вывеской бочек, туман над водой, сумеречное освещение, приглушённые цвета сине-золотые, стиль концепт-арта для настольной ролевой игры, высокая детализация, без подписей на картинке
```

### English prompt (often stronger in MJ/SD)

```
Top-down illustrated fantasy coastal city map, wide river runs vertically through the center splitting the town, old stone abbey with bell tower on east bank, wooden bridge and stone dam weir at the lower end, warehouse district, market square, cozy tavern, river fog, dusk blue and amber lighting, painterly concept art style for tabletop RPG, highly detailed, no text labels on image, 8k
```

---

## 2. Социалка / драка — таверна «У трёх бочек»

**Файл:** `maps/02-taverna-tri-bochki.png`  
**Сцена:** столы, бар, возможна драка.

### Русский

```
Вид строго сверху, интерьер средневековой таверны, деревянный пол с балками, длинная барная стойка слева, круглые столы с лавками, кухня в дальнем углу, тёплый свет свечей и очага, бочки как декор, пустая сцена без людей для фишек игроков, настольная ролевая карта, детализированная, уютная атмосфера с напряжением, без текста на изображении
```

### English

```
Strictly top-down view, medieval fantasy tavern interior battle map, wooden floor planks and beams, long bar counter on one side, round tables and benches, kitchen corner, warm candle and hearth glow, barrel decorations, empty of people for VTT tokens, cozy yet tense atmosphere, detailed TRPG battlemap, no text, high resolution
```

---

## 3. Экшен — запруда и мост (погоня, засада)

**Файл:** `maps/03-zapruda-most.png`

### Русский

```
Вид сверху, ночная или сумеречная сцена, каменная плотина и шлюз, деревянный настил-мост через сильный поток реки, баржи у причалов по бокам, бочки и верёвки, брызги воды, холодный сине-стальной свет, места укрытия за ящиками, поле для тактики боя, фэнтези, кинематографично, без персонажей на картинке, без надписей
```

### English

```
Top-down fantasy battle map, stone dam and lock gates, wooden walkway bridge over rushing river, moored barges with ropes and crates on both sides, night or twilight, cold blue moonlight on water spray, cover behind cargo, dramatic cinematic lighting, empty of characters, tactical TRPG map, no text labels, ultra detailed
```

---

## 4. Детектив — библиотека обители

**Файл:** `maps/05-biblioteka-obitel.png`

### Русский

```
Вид сверху, тихая библиотека в старом монастыре, высокие стеллажи с книгами разных цветов корешков, большой деревянный стол для чтения по центре, окно с лунным светом, каменный пол, восковые следы свечей, таинственная спокойная атмосфера, пустая сцена для ролевой игры, детализация, без людей, без текста на стенах
```

### English

```
Top-down monastery library battle map, tall bookshelves filled with colorful book spines, large central reading table, moonlight through arched window, stone floor, wax candle stains, mysterious calm mood, empty for tokens, fantasy TRPG, highly detailed, no readable text on books, no people
```

---

## 5. Финал — камера под колоколом

**Файл:** `maps/04-kamora-kolokol.png`

### Русский

```
Вид сверху, подземная камера под огромным висящим бронзовым колоколом, круглая платформа над бурлящей тёмной водой, цепи и рычаг у края, узкая галерея для стрельбы по периметру, зловещее зеленовато-синее свечение из глубины воды, отражения стекла, жуткая драматичная атмосфера, без людей, настольная карта боя, фэнтези-хоррор, высокая детализация, без надписей
```

### English

```
Top-down underground ritual chamber battle map, massive bronze bell hanging above churning dark water, circular stone platform, chains and lever mechanism, elevated gallery walkway for ranged attacks, eerie teal glow from water depths, glassy reflections, horror fantasy dramatic mood, empty of characters, TRPG finale map, ultra detailed, no text
```

---

## Краткая шпаргалка по именам файлов

| Сцена | Имя PNG |
|-------|---------|
| Город | `01-gorod-seryy-prichal.png` |
| Таверна | `02-taverna-tri-bochki.png` |
| Запруда | `03-zapruda-most.png` |
| Камера финала | `04-kamora-kolokol.png` |
| Библиотека | `05-biblioteka-obitel.png` |

После генерации положите файлы в `rpg/adventure/maps/` и при необходимости выполните `npm run build` (сайт скопирует PNG в `public/`).
