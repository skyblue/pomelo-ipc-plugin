app.configure('production|development', function () {
    require("pomelo-ipc-plugin")(app)
})
直接以函数调用的方式调用同进程内的Remote
eg:
this.app.ipc.user.userRemote.update(session, uid, data, cb)


//好吧 其实不是plugin