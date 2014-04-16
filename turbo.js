(function() {

    function isObject(obj) {
        return Object.prototype.toString.call(obj) === '[object Object]';
    }

    function isArray(obj) {
        return Object.prototype.toString.call(obj) === '[object Array]';
    }

    var Turbo = {
        errorClass: 'has-error',
        alert: function(msg) { alert(msg); },
        add: function(funcName, args, func, event) {
            var turboSelf = this;

            this[funcName] = func;

            if(event !== undefined) {
                $('[' + funcName + ']').on(
                    event,
                    function(event) {
                        var element = $(this);

                        var argsNew = args.map(function(x) {
                            var attr = element.attr(x);

                            return attr !== undefined ? attr : x;
                        });

                        argsNew = argsNew.concat([element, event]);

                        turboSelf[funcName].apply(this, argsNew);
                    }
                );
            }
        },
        reload: function() { window.location.reload(); },
        redirect: function(url) { window.location = url; },
        execute: function(json) {
            if(isObject(json)) {
                for(var func in json) {
                    var args = [];

                    if(isObject(json[func]))
                        for(var i in json[func]) {
                            args.push(json[func][i]);
                        }
                    else if(isArray(json[func]))
                        args = json[func];
                    else
                        args = [json[func]];

                    this[func].apply(this, args);
                }
            }
            else if(isArray(json)) {
                for(var func in json) {
                    this[json[func]].apply(this);
                }
            }
            else {
                var regex = /[a-z]+\(.*?\)/gi;

                var functions = json.match(regex);

                for(var f in functions) {
                    var func = functions[f].match(new RegExp('^([a-z]+)\\((.*)\\)$', 'i'));
                    var args = eval('['+ func[2] + ']');

                    this[func[1]].apply(this, args);
                }
            }
        }
    };


    /**
     * Adds the load function that allows an element to be filled with the content of a page at a given url.
     * Binds the load function to the load and update events.
     *
     * Triggers load-start, load-success, load-fail, and load-complete events
     */
    Turbo.add('load', ['load'], function(url, element, event) {
        element = $(element);

        element.trigger('load-start');

        $.get(
            url
        ).done(function(data) {
                element.html(data);

                element.trigger('load-success', data);
            }).fail(function(data) {
                console.error('Unable to retrieve data from ' + url + ' : ' + data);

                element.trigger('load-fail', data);
            }).always(function(data) {
                element.trigger('load-complete', data);
            });
    }, 'load update');


    /**
     * Adds the ajax function, triggered when a form having this attribut is submitted. Sends the form via ajax, displays
     * info or error messages, and executes Turbo functions if needed, contained in the json returned by the ajax call.
     * Binds the ajax function to the submit event.
     *
     * Triggers ajax-start, ajax-success, ajax-fail, and ajax-complete events.
     */
    Turbo.add('ajax', ['method', 'action', 'showErrors'], function(method, url, showErrors, form, event) {
        event.preventDefault();

        form.trigger('ajax-start');

        var params = form.serializeArray();

        $.ajax({
            url: url,
            type: method,
            data: params
        }).done(function(datas) {

            if(datas.execute !== undefined)
                window.Turbo.execute(datas.execute)

            form.trigger('ajax-success', datas);
        }).fail(function(req) {

            var errors = req.responseJSON;

            for(var key in errors) {
                if(key === 'execute') {
                    window.Turbo.execute(errors.execute);
                }
                else if(key === 'errors' && (showErrors === 'showErrors' || showErrors === true)) {
                    for(var id in errors.errors) {
                        if(id === 'global') {
                            var globalErrorClassTo = form.attr('globalErrorClassTo');
                            var globalErrorMessageTo = form.attr('globalErrorMessageTo');

                            if(globalErrorClassTo !== undefined)
                                $(globalErrorClassTo).addClass(window.Turbo.errorClass);
                            else
                                form.addClass(window.Turbo.errorClass);

                            if(globalErrorMessageTo !== undefined)
                                $(globalErrorMessageTo).text(errors.errors[id]);
                            else {
                                if(form.find('.error-global').length > 0)
                                    form.find('.error-global').text(errors.errors[id]);
                                else
                                    form.append('<div class="error-global">' + errors.errors[id] + '</div>');
                            }
                        }
                        else {
                            $('[name=' + id + ']').each(function(i, elem) {
                                elem = $(elem);

                                if(elem.attr('showErrors') === undefined || elem.attr('showErrors') === true) {
                                    var errorClassTo = elem.attr('errorClassTo');
                                    var errorMessageTo = elem.attr('errorMessageTo');

                                    if(errorClassTo !== undefined)
                                        $(errorClassTo).addClass(window.Turbo.errorClass);
                                    else
                                        elem.addClass(window.Turbo.errorClass);

                                    if(errorMessageTo !== undefined)
                                        $(errorMessageTo).text(errors.errors[id]);
                                    else {
                                        if($('#error-' + id).length > 0)
                                            $('#error-' + id).text(errors.errors[id]);
                                        else
                                            elem.after('<div id="error-' + id + '" class="error">' + errors.errors[id] + '</div>');
                                    }
                                }
                            });
                        }
                    }
                }
            }

            form.trigger('ajax-fail', errors);
        }).always(function(datas) {
            form.trigger('ajax-complete', datas);
        });

    }, 'submit');

    window.Turbo = Turbo;

    $('[load]').trigger('load');
})()