var logger = require('pomelo-logger').getLogger('pomelo', __filename)

module.exports = function (app) {
    if ("master" === app.getServerType()) {
        return false
    }

    var getArgs = function (arguments_, slice) {
        slice = slice | 0
        var l = arguments_.length - slice
        var args = new Array(l)
        for (var i = 0; i < l; i++) {
            args[i] = arguments_[i + slice]
        }
        return args
    };

    var events = require('pomelo/lib/util/events')

    app.event.on(events.START_SERVER, function () {
        app.ipcProxies = {}

        var wrap_ = function (method, obj) {
            return function () {
                return obj[method].apply(obj, getArgs(arguments, 1))
            }
        }

        var loadAll_ = function () {
            var remotes = app.components.__remote__.remote.services.user
            var modules = app.ipcProxies[app.serverType] = {}
            for (var remoteName in remotes) {
                modules[remoteName] = {}
                var obj = remotes[remoteName]
                for (var method in obj) {
                    if (typeof obj[method] === "function") {
                        modules[remoteName][method] = wrap_(method, obj)
                    }
                }
            }
        }

        loadAll_()

        var pathUtil = require('pomelo/lib/util/pathUtil')
        var remotePath = pathUtil.getUserRemotePath(app.getBase(), app.serverType)
        var reloadRemotes = !!app.components.__remote__.opts.reloadRemotes

        if (remotePath && reloadRemotes) {
            require("fs").watch(remotePath, function (event) {
                if (event === "change") {
                    loadAll_()
                    console.warn("[ipc.js] ipc reload: ", app.serverType)
                }
            })
        }
        app.ipc = app.ipcProxies

    })
};

module.exports.name = '__ipc__'

