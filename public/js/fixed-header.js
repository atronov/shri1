/**
 * Created by atronov on 21.07.15.
 */
$(document).on("ready", function() {
    var $table = $(".flight-table");
    $(document).on("scroll resize", function() {
        var top = $table.scrollTop();
    });
});