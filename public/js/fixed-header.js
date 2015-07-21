/**
 * Created by atronov on 21.07.15.
 */
$(document).on("ready", function() {
    var $headerRow = $(".table__row-header");
    var $fixedHeaders = $headerRow.find(".my-cell");
    $(document).on("scroll resize", function() {
        var windowTop =  $headerRow.offset().top - $(window).scrollTop();
        if (windowTop < 0) {
            $fixedHeaders
                .css("top", -windowTop+"px")
                .css("bottom", windowTop+"px");
        } else {
            $fixedHeaders
                .css("top", "0px")
                .css("bottom", "0px");
        }
    });
});