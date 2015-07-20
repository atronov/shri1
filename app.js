var express = require('express');
var Handlebars = require('handlebars');
var fs = require("fs");

var app = express();

// тут всякие стили
app.use(express.static("public"));

// я положил в виде файла, но в жизни надо было бы использовать какойто REST HTTP
app.use("/table.json", express.static("table.json"));

app.get('/', function(req, res) {
    var tableSource = fs.readFileSync("table.template.html", "utf8");
    var blankSource = fs.readFileSync("blank.template.html", "utf8");
    var tableData = JSON.parse(fs.readFileSync("table.json", "utf8"));
    var pageHtml = Handlebars.compile(tableSource)(tableData);
    pageHtml = Handlebars.compile(blankSource)(pageHtml);
    res.send(pageHtml);
});

module.exports = app;