var vdbBench = (function(vdbBench) {
    vdbBench.pluginName = 'vdb-bench';
    vdbBench.pluginPath = 'plugins/vdb-bench';
    vdbBench.templatePath = vdbBench.pluginPath + "/html";
    vdbBench.pagePath = vdbBench.templatePath + "/pages";
    vdbBench.widgetPath = vdbBench.templatePath + "/widgets";
    vdbBench.imgPath = vdbBench.pluginPath + "/img";

    vdbBench.RestServiceException = function(message) {
        this.message = message;
        this.toString = function () {
            return this.message;
        };
    }

    vdbBench._module = angular.module(vdbBench.pluginName, [ 'ngAnimate', 'ui.bootstrap', 'ui.codemirror', 'prettyXml', 'restangular' ]);

    vdbBench._module.constant("SYNTAX", {
                                                    FORWARD_SLASH : "/",
                                                    OPEN_BRACKET : "(",
                                                    CLOSE_BRACKET : ")",
                                                    OPEN_SQUARE_BRACKET : "[",
                                                    CLOSE_SQUARE_BRACKET : "]",
                                                    COMMA : ",",
                                                    COLON : ":",
                                                    HYPHEN : "-",
                                                    UNDERSCORE : "_",
                                                    SPACE : " ",
                                                    DOT : "."
                                                }
                                            );

    vdbBench._module.constant("VDB_KEYS", {
                                                    "VDBS" : "vdbs",
                                                    "ID" : "keng__id",
                                                    "DESCRIPTION" : "keng__description",
                                                    "TYPE" : "keng__kType",
                                                    "LINKS" : "keng___links",
                                                    "LINK_NAME" : "rel",
                                                    "LINK_HREF" : "href",
                                                    "PROPERTIES" : "keng__properties"
                                                }
                                             );

    vdbBench._module.constant("VDB_SCHEMA", {
                                                    "SCHEMA" : "schema",
                                                    "ID" : "keng__id",
                                                    "DESCRIPTION" : "keng__description",
                                                    "K_TYPE" : "keng__kType",
                                                    "VALUE_TYPE" : "keng__type",
                                                    "REQUIRED" : "keng__required",
                                                    "REPEATABLE" : "keng__repeatable",
                                                    "LIMIT" : "keng__limit",
                                                    "PROPERTIES" : "keng__properties",
                                                    "CHILDREN" : "keng__children",
                                                    "SCHEMA_PROPERTY" : "property"
                                                }
                                             );
    var tab = undefined;

    vdbBench._module.config([
            '$routeProvider',
            'HawtioNavBuilderProvider',
            '$locationProvider',
            function($routeProvider, builder, $locationProvider) {
                $locationProvider.html5Mode(true);
                tab = builder.create().id(vdbBench.pluginName).title(
                        function() {
                            return 'Vdb Workbench';
                        }).href(function() {
                                return '/vdb-bench';
                            })
                                .subPath('Workspace', 'wkspace',
                                        builder.join(vdbBench.pagePath, 'wkspacePage.html')
                                )
                                .subPath(
                                        'Manage Repositories',
                                        'repos',
                                        builder
                                            .join(vdbBench.pagePath,
                                                'repoPage.html')).build();

                builder.configureRouting($routeProvider, tab);
            } ]);

    /**
     * Extends the exception handler to alert the user to an exception
     */
    vdbBench._module.config(function($provide) {
        $provide.decorator("$exceptionHandler", function($delegate) {
            return function(exception, cause) {
                $delegate(exception, cause);
                alert("An exception occurred:\n" + exception.message);
            };
        });
    });

    vdbBench._module.run([ 'HawtioNav', 'preferencesRegistry',
            function(HawtioNav, preferencesRegistry) {
                // preferencesRegistry.addTab("Repositor",
                // 'app/wiki/html/gitPreferences.html');

                HawtioNav.add(tab);
            } ]);

    hawtioPluginLoader.addModule(vdbBench.pluginName);

    return vdbBench;

})(vdbBench || {});
