var express = require('express');
var Handlebars = require('handlebars');
var fs = require("fs");

var app = express();

// тут всякие стили
app.use(express.static("public"));

// я положил в виде файла, но в жизни надо было бы использовать какойто REST HTTP
app.use("/flights.json", express.static("flights.json"));

app.get('/', function(req, res) {
    var tableSource = fs.readFileSync("flights.template.html", "utf8");
    var pageSource = fs.readFileSync("page.template.html", "utf8");
    var tableData = JSON.parse(fs.readFileSync("flights.json", "utf8"));
    Handlebars.registerPartial("flights", tableSource);
    var pageHtml = Handlebars.compile(pageSource)(tableData);
    res.send(pageHtml);
});

module.exports = app;