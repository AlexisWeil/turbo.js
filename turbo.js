
var Turbo = {
    $load: function (url, element) {

        $.get(url).always(
            function(data) {
                console.log(data);
            }
        )

    }
};

(function() {
    Turbo.$load("/test")
})()