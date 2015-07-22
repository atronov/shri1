/**
 * Created by vkusny on 12.07.15.
 */
var jsdom   = require('jsdom');
var fs      = require('fs');
var zlib    = require("zlib");
var Promise = require("promise");
var http    = require("http");
var URL     = require("url");

var url = "http://www.svo.aero/";
var jQueryUrl = "http://code.jquery.com/jquery-2.1.4.min.js";
var jQuery = ""; // будет загружен при запуске
var resultFile = "table.json";
var planes = [];

/**
* Поумолчанию jsdom не умеет работать с gzip, пришлось создать функцию для разжатия.
* @param url {string}
* @return {Promise}
*/
function httpGet(url) {
    return new Promise(function(resolve, reject) {
        http.get(url, function(res) {
            res.on("error", reject);
            var body = "";
            var output;
            if(res.headers['content-encoding'] == 'gzip' ) {
                var gzip = zlib.createGunzip();
                res.pipe(gzip);
                output = gzip;
            } else {
                output = res;
            }
            output.on('data', function (data) {
                data = data.toString('utf-8');
                body += data;
            });
            output.on('end', function() {
                resolve(body, res);
            });
        }).on("error", reject);
    });
};

function parseDOM(html) {
    return new Promise(function(resolve, reject) {
        jsdom.env({
                html: html,
                src: [jQuery],
                done: function(errors, window) {
                    if (errors) reject(errors);
                    resolve(window);
                }
        });
    });
};

function readTable(window) {
    var $ = window.$;
    var rows = [];
    $(".content-main").find(".sA, .sD").each(function (ind) {
        var $cells = $(this).children("td");
        var type = ($(this).hasClass("sD")) ? "departure" : "arrival";
        var time = $cells.eq(0).text();
        var number = $cells.eq(2).text();
        var companyTitle = $cells.eq(3).find("img").attr("alt") || "";
        var companyLogo = $cells.eq(3).find("img").attr("src") || "";
        var planeTitle = "";
        var planeShort = "";
        var direction = $cells.eq(4).text();
        var flightUrl = $cells.eq(4).find("a").attr("href");
        var info = "Терминал " + $cells.eq(5).text();
        var status = $cells.eq(6).text();
        rows.push({
            "type": type,
            "time": time,
            "number": number,
            "company": { "title": companyTitle, "logo": companyLogo },
            "plane": { "title": planeTitle, "short": planeShort },
            "airport": direction,
            "status": status,
            "info": info,
            "flightUrl": flightUrl
        });
    });
    return rows;
}

function readPlanes(window) {
    var $ = window.$;
    var planes = [];
    var extendShortRegex = /([A-Z]+)([0-9]+.*)/;
    var extendTitleRegex = /(.+)\((.+)\)/;
    $("table").eq(0).find("tr").slice(1).each(function(ind) {
        var $row = $(this);
        var shorts = [];
        var titles = [];
        var $cells = $row.find("td");
        titles.push($cells.eq(0).text().trim());
        shorts.push($cells.eq(3).text().trim());
        shorts.push($cells.eq(2).text().trim());
        shorts = shorts.filter(function(short) {
            return short !== "n/a" && short.length > 0;
        });
        // ставим дефисы
        var extendedShort = shorts.filter(function(name) {
            return name.match(extendShortRegex);
        }).map(function(name) {
            return name.replace(extendShortRegex, "$1-$2").trim();
        });
        shorts = shorts.concat(extendedShort);
        // выбираем альтернативные имена из скобок
        var newTitles = [];
        titles.filter(function(name) {
            return name.match(extendTitleRegex);
        }).forEach(function(name) {
            var matches = name.match(extendTitleRegex);
            newTitles.push(matches[2].trim());
            newTitles.push(matches[1].trim());
        });
        titles = titles.concat(newTitles);

        planes.push({
            shorts: shorts,
            titles: titles
        });
    });
    planes.push({ shorts: ["Су 100-90"],  titles: ["Сухой Суперджет 100-90"] })
    return planes;
}

function addRussians(planes) {
    var engToRus = [
        ["Boeing", "Боинг"],
        ["A", "А"],
        ["Боинг ", "Боинг-"],
        ["A340", "A-330-300"]
    ];
    planes.forEach(function(plane) {
        engToRus.forEach(function(map) {
            plane.titles.forEach(function(title) {
               if (title.indexOf(map[0]) !== -1) plane.titles.push(title.replace(map[0],map[1]));
            });
            plane.shorts.forEach(function(short) {
                if (short.indexOf(map[0]) !== -1) plane.shorts.push(short.replace(map[0],map[1]));
            });
        });
    });
    return planes;
}

function loadPlanes() {
    var planesText = fs.readFileSync(planesFile, "utf8");
    planes = JSON.parse(planesText);
}

function resolveUrls(rootUrl, rows) {
    rows.forEach(function(row) {
        if (row.company.logo) row.company.logo = URL.resolve(rootUrl, row.company.logo);
        if (row.flightUrl) row.flightUrl = URL.resolve(rootUrl, row.flightUrl);
        if (row.company.bigLogo) row.company.bigLogo = URL.resolve(rootUrl, row.company.bigLogo);
    });
    return rows;
}

function addFullInfo(rootUrl, row) {
    if (row.flightUrl) {
        var url = URL.resolve(rootUrl, row.flightUrl);
        return httpGet(url)
            .then(parseDOM)
            .then(readFullInfo.bind(null, row));
    };
}

function readFullInfo(row, window) {
    var $ = window.$;
    var content = $(".content");
    var companyBigLogo = content.find(".logo").attr("src");
    var planeShort = content.find("td:contains(Тип воздушного судна)").siblings().eq(0).text();
    var rout = content.find("td:contains(Плановый маршрут рейса)").siblings().eq(0).text();
    row.company.bigLogo = companyBigLogo;
    row.plane.short = planeShort;
    row.plane.title = planeShort;
    row.rout = rout;
    return row;
}

function addFullInfoAll(rootUrl, rows) {
    var rowPromises = [];
    rows.forEach(function(row) {
        var rowPromise = addFullInfo(rootUrl, row);
        if (rowPromise) rowPromises.push(rowPromise);
    });
    return Promise.all(rowPromises);
}

function matchPlanes(flights) {
    flights.forEach(function(flight){
        if (flight.plane.short === "" && flight.plane.title === "") return;
        for (var i in planes) {
            var plane = planes[i];
            // пробуем связать по короткому имени
            var matches = plane.shorts.some(function(short) { return flight.plane.short === short; });
            if (matches) {
                flight.plane.title = plane.titles[0];
                return;
            }
            // пробуем связать по длинному имени
            matches = plane.titles.some(function(title) { return flight.plane.title === title; });
            if (matches) {
                flight.plane.short = plane.shorts[0];
                return;
            }
        }
        console.error("Не смогли связать", JSON.stringify(flight.plane));
    });
    return flights;
}

function loadJQuery() {
    return httpGet(jQueryUrl)
        .then(function (script) {
            jQuery = script;
        });
}

function downloadTable() {
    loadPlanes();
    loadJQuery()
        // загружаем все табло
        .then(httpGet.bind(null, url))
        // парсим
        .then(parseDOM)
        // и читаем нужные поля
        .then(readTable)
        // для каждго рейса получаем полную информация
        .then(addFullInfoAll.bind(null, url))
        .then(resolveUrls.bind(null, url))
        .then(matchPlanes)
        // сохраняем результат как json файл на диск
        .then(JSON.stringify)
        .then(fs.writeFile.bind(fs, resultFile))
        .catch(function (er) {
            console.error(er);
            console.error(er.message);
            console.error(er.stack);
        });
}

var planesUrl = "http://skalolaskovy.narod.ru/avia/type_of_aircrafts.html";
var planesFile = "planes.json";

function downloadPlanes() {
    loadJQuery()
        // загружаем все табло
        .then(httpGet.bind(null, planesUrl))
        // парсим
        .then(parseDOM)
        .then(readPlanes)
        .then(addRussians)
        .then(JSON.stringify)
        .then(fs.writeFile.bind(fs, planesFile))
        .catch(function (er) {
            console.error(er);
            console.error(er.message);
            console.error(er.stack);
        });
}

// downloadPlanes();
downloadTable();

