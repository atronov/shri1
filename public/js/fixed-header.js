/**
 * Created by atronov on 21.07.15.
 */
var headerRow = document.querySelector(".table__row-header");
var fixedHeaders = document.querySelectorAll(".table__cell-header--fixed");
var handleScroll = function() {
    var windowTop = headerRow.getBoundingClientRect().top;
    if (windowTop < 0) {
        Array.prototype.forEach.call(fixedHeaders, function(header) {
            header.style.top = -windowTop+"px";
            header.style.bottom = windowTop+"px";
        });
    } else {
        Array.prototype.forEach.call(fixedHeaders, function(header) {
            header.style.top = "0px";
            header.style.bottom = "0px";
        });
    }
};
document.addEventListener("scroll", handleScroll);
document.addEventListener("resize", handleScroll);