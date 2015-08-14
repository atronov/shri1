var express = require('express');
var Handlebars = require('handlebars');
var fs = require("fs");
var path = require("path");

var templateDirPath = "client/templates";
var flightsTemplatePath = path.join(templateDirPath, "flights.template.html");
var pageTemplatePath = path.join(templateDirPath, "page.template.html");

var app = express();

/**
 * Функция-шаблон Handlebars для генерации страницы
 * @type {function(object)}
 */
var template = null;

// в эту папку собирает gulp
app.use(express.static("public"));

// я положил в виде файла, но в жизни надо было бы использовать какойто REST HTTP
app.use("/flights.json", express.static("flights.json"));

app.get('/', function(req, res) {
    var html = createPageHtml();
    res.send(html);
});

/**
 * Создаём html-контент страницы
 * @return {string} html
 */
function createPageHtml() {
    if (!template) {
        template = createTemplate();
    }
    var tableData = JSON.parse(fs.readFileSync("flights.json", "utf8"));
    return template(tableData);
}

/**
 * Создание функции-шаблона для генерации контента
 * @return {function(object)}
 */
function createTemplate() {
    var tableSource = fs.readFileSync(flightsTemplatePath, "utf8");
    var pageSource = fs.readFileSync(pageTemplatePath, "utf8");
    Handlebars.registerPartial("flights", tableSource);
    // вместо пустого значения вставляем пробел, иначе не работает выделение строки, если ячейка пустая
    Handlebars.registerHelper("noEmpty", function(value) {
        return value || "&nbsp;";
    });
    return Handlebars.compile(pageSource);
}

module.exports = app;