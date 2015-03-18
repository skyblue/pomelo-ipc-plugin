module.exports = function (app) {
    if("master" === app.getServerType()){
        return false;
    }
    var events = require('pomelo/lib/util/events');
    app.event.on(events.START_SERVER, function(){
        app.ipcProxies = {};

        var remotes =  app.components.__remote__.remote.services.user;
        var modules = app.ipcProxies[app.serverType] = {};
        var wrap_ = function(method, obj){
            return function() {
                var args = Array.prototype.slice.call(arguments, 1);
                return obj[method].apply(obj, args);
            };
        };

        var loadAll_ = function(remotes) {
            for(var remoteName in remotes) {
                modules[remoteName] = {};
                var obj = remotes[remoteName];
                for(var method in obj) {
                    if( typeof obj[method] === "function") {
                        modules[remoteName][method] = wrap_(method, obj);
                    }
                }
            }
        };

        loadAll_(remotes);

        var pathUtil = require('pomelo/lib/util/pathUtil');
        var remotePath = pathUtil.getUserRemotePath(app.getBase(), app.serverType);
        var reloadRemotes = !!app.components.__remote__.opts.reloadRemotes;

        if(remotePath && reloadRemotes) {
            require("fs").watch(remotePath, function(event) {
                if(event === "change" ) {
                    var remotes =  app.components.__remote__.remote.services.user;
                    loadAll_(remotes);
                    console.log("[inproc.js] ipc: reload all");
                }
            });
        }
        app.__defineGetter__('ipc', function() {
            return this.ipcProxies;
        });

    })
};