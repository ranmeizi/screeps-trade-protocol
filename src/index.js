const Api = {
    setBlackList() {

    },
    trans(sourceRoom, targetRoom) {
        
    },
    on() {

    },
    onBreak() {

    },
    onError() {

    },
    onSuccess() {

    },
    reissue() {

    },
    call(){
        // recive message or poll the connection
    }
}

const Ctx = {
    set() {

    },
    get() {
        return Memory['__screep_trans__'] || {}
    }
}

const Events={
    BreakEvent:function({message}){},
    ErrorEvent:function({message}){},
    SuccEvent:function({message}){}
}

const utils={
    dispatchEvent(event){

    }
}

const connection={
    connect(terminal){

    }
}

const impls={
    trans(sourceRoom, targetRoom){
        // check room exist
        if(!Game.rooms[sourceRoom]){
            const evt = Events.ErrorEvent({
                message:'room not exist,'
            })
            return utils.dispatchEvent(evt)
        }
        // check terminal exist
        if(!Game.rooms[sourceRoom].terminal){
            const evt = Events.ErrorEvent({
                message:'terminal not exist,'
            })
            return utils.dispatchEvent(evt)
        }

        const ctx = Ctx.get()
        // check terminal busy
        const terminal = Game.rooms[sourceRoom].terminal
        if(ctx[terminal.id]){
            const evt = Events.ErrorEvent({
                message:'terminal is now in trans,'
            })
            return utils.dispatchEvent(evt)
        }
        
        // try connect
        connection.connect(terminal)
    }
}

module.exports = Api