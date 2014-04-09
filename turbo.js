
(function() {

    function getParamNames(fn) {
        var funStr = fn.toString();
        return funStr.slice(funStr.indexOf('(') + 1, funStr.indexOf(')')).match(/([^\s,]+)/g);
    }

    function getFuncName(expr) {
        return expr.slice(0, expr.indexOf('('));
    }

    var Turbo = {
        add: function(expr, func) {
            var argExpr = getParamNames(expr)[0];
            var argsFunc = getParamNames(func);
            var funcName = getFuncName(expr);

            this[funcName] = function(element, value) {
                var elem = $(element);

                var args = argsFunc.map(function(x) {
                    if(x.replace('$', '') === argExpr)
                        return value;
                    else if(x === '$element')
                        return elem;
                    else if(elem.attr(x) !== undefined)
                        return elem.attr(x)
                    else
                        return null;
                });

                func.apply(this, args);
            }
        }
    };

    Turbo.add('$load(url)', function($url, $element) {
        $.get($url)
            .done(
                function(data) {
                    $element.html(data);
                }
            )
            .fail(
                function(data) {
                    console.error('Unable to retrieve data from ' + url + ' : ' + data);
                }
            )
    });

    window.Turbo = Turbo;
})()

Turbo.$load('#Content', '/test');