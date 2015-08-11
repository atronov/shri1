# shri1
##Вступительное задание в ШРИ - №1

[Рабочая версия](http://flights.atronov.ru/).

Удалось реализовать клиент на CSS, кроме позиционирования заголовка всегда сверху окна. Известный мне рецепт на CSS предполагает скролирование tbody внутри table. Мне этот вариант не нравится.

Для контента я использовал [табло на сайте Шереметьево](http://www.svo.aero/). Однако, там неполная инфорация про тип воздушного судна. Список воздушных судов и сокращений я нашёл на [этой сранице](http://skalolaskovy.narod.ru/avia/type_of_aircrafts.html).

Для загрузки контента написал скрипт load-data.js. В нём я парсю страницу через jsdom и jQuery и сохраняю результат на диск (flights.json и planes.json).<br/>
Чтобы запустить загрузку:<br/>
`nodejs load-data.js planes` - самолёты (надо загружать первыми);<br/>
`nodejs load-data.js flights` - рейсы.<br/>
Если вдруг сломается парсинг, я загрузил planes.json в git, flights.json можно [скачать](http://flights.atronov.ru/flights.json) с сервера.

HTML генерируется через [Handlebars](http://handlebarsjs.com/) на сервере. Handlebars может стать плюсом, если захочется обновлять табло, без перезагрузки страницы через long-polling. Я не стал пока делать динамическую версию, т.к. структура сайтов, которые я парсю, может поменяться и будет фейл.
Сервер написан на Express просто потому, что так проще.

Когда контент загружен, можно запустить сервер:
`nodejs bin/www`

По умолчанию, сервер запустится на [http://localhost:3000](http://localhost:3000).
