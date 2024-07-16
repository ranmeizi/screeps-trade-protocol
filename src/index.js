const MEMORY_KEY = 'custom_market'

/**
 * 画图
 * @param {Room} room 
 * @param {any} data 
 */
function draw(room, data) {
    function drawRow(row) {
        // 计算消耗

        // 每条画出可选的交易区间
    }
    // 画出清单

    for (let row of data) {
        drawRow(row)
    }
}

/**
 * 计算能量消耗
 */
function calc() {

}

/**
 * 
 * @param {TradeTerminal} trade 
 * @param {number} tickTimeout 
 */
function tradeFailTimer(trade, tickTimeout) {
    if (trade.memory.status_tick + tickTimeout >= Game.time) {
        // 结束
        transStatus(trade.memory, 'FAIL')

        return true
    }


    return false
}

function checkMemory() {
    if (!Memory[MEMORY_KEY]) {
        Memory[MEMORY_KEY] = {
            lastIncomingId: '',
            blackList: [],
            terminals: {}
        }
    }
}

function createContract(rule){

}

/**
 * 最新的几条message
 * @type {(Transaction&{description:Record<string,any>})[]}
 */
let letestMessage = []

/**
 * 获取最新的消息
 */
function getLetestMessage() {
    if (Game.market.incomingTransactions.length === 0) {
        return
    }

    const { lastIncomingId } = Memory[MEMORY_KEY]

    for (let transaction of Game.market.incomingTransactions) {
        if (transaction.transactionId === lastIncomingId) {
            // 终止
            break;
        }

        const { description } = transaction

        try {
            letestMessage.push({ ...transaction, description: JSON.parse(description) })
        } catch { }
    }

    // 更新最新id
    Memory[MEMORY_KEY].lastIncomingId = Game.market.incomingTransactions[0].transactionId
}

function run() {
    // 检查 Memory
    checkMemory()

    // 接受消息
    getLetestMessage()

    for (let [roomName, memory] of Object.entries(Memory[MEMORY_KEY].terminals)) {
        const { status } = memory

        const handler = handlers[status]

        if (handler) {
            handler(new TradeTerminal(roomName))
        }
    }
}

/**
 * 
 * @param {string} roomName 
 */
function select(roomName) {
    const terminal = Game.rooms[roomName].terminal
    const memory = Memory[MEMORY_KEY].terminals[roomName]
    return {
        terminal,
        memory
    }
}

/**
 * 
 * @param {TradeTerminalMemory} memory 
 * @param {Status} status 
 */
function transStatus(memory, status) {
    memory.status = status
    memory.status_tick = Game.time
}

/**
 * @type {Record<Status,(trade:TradeTerminal)=>void>}
 */
const handlers = {
    LISTEN(trade) {
        // 等待交易单信息
        for (let i = 0; i < letestMessage.length; i++) {
            const transaction = letestMessage[i]
            if (!trade.memory.connection.roomName && transaction.to === trade.terminal.room.name) {
                if (transaction.description.t === 'conn') {
                    const resource = transaction.description.r

                    // 发送 rules 列表
                    if (trade.sendRules(resource)) {
                        // 消费掉
                        letestMessage.splice(i, 1)
                        // 改变状态为 WAIT_SEND
                        transStatus(trade.memory, 'WAIT_SEND')
                    }


                }
            }
        }
    },
    WAIT_LIST(trade) {
        // 等待交易单信息中的 list 数据 画图
        for (let transaction of letestMessage) {
            if (trade.memory.connection.roomName === transaction.from && transaction.to === trade.terminal.room.name) {
                if (transaction.description.t === 'list') {
                    const data = transaction.description.d

                    // 画图
                    draw(Game.rooms[trade.terminal.room.name], data)

                    // 改变状态为 WAIT_TRADE
                    transStatus(trade.memory, 'WAIT_TRADE')
                    break;
                }
            }
        }
    },
    WAIT_TRADE(trade) {
        // 检查 sendBuf 有没有内容
        if (trade.memory.sendBuf) {
            // 发送
            if (trade.doSendResource()) {

                // 删除buf
                trade.memory.sendBuf = undefined

                // 改变状态为 WAIT_RECIEVE
                transStatus(trade.memory, 'WAIT_RECIEVE')
            }
        }
    },
    WAIT_SEND(trade) {
        // 等待交易单信息中的 list 数据 画图
        for (let i = 0; i < letestMessage.length; i++) {
            const transaction = letestMessage[i]
            if (trade.memory.connection.roomName === transaction.from && transaction.to === trade.terminal.room.name) {
                if (transaction.description.t === 'trade_send') {

                    // 发资源吧
                    if (trade.doRecieveResource()) {

                        // 改变状态为 
                        transStatus(trade.memory, 'COMPLETE')
                        break;
                    }
                }
            }
        }
    },
    WAIT_RECIEVE(trade) {
        // 等待交易单信息中的 list 数据 画图
        for (let transaction of letestMessage) {
            if (trade.memory.connection.roomName === transaction.from && transaction.to === trade.terminal.room.name) {
                if (transaction.description.t === 'trade_recieve') {
                    // 检查一下资源，是不是要报警

                    // 改变状态为 COMPLETE
                    transStatus(trade.memory, 'COMPLETE')
                }
            }
        }
    },
    COMPLETE(trade) {
        // 收尾
        trade.memory.connection = undefined
        transStatus(trade.memory, 'LISTEN')
    },
    FAIL(trade) {
        // 报错
        // 收尾
        this.COMPLETE(trade)
    }
}

class TradeTerminal {

    /**
     * terminal
     * @memberof TradeTerminal
     * @type {StructureTerminal}
     */
    terminal

    /**
     * @memberof TradeTerminal
     * @type {TradeTerminalMemory | undefined}
     */
    memory

    constructor(roomName) {
        const { terminal, memory } = select(roomName)

        this.terminal = terminal
        this.memory = memory
    }

    /**
     * 创建连接
     */
    connect(roomName) {
        this.terminal.send(RESOURCE_ENERGY, 1, roomName, JSON.stringify({

        }))
    }

    /**
     * 开始交易
     */
    trade(id, amount) {
        if (this.memory.status === 'WAIT_TRADE') {
            // 发送
            const message = {
                t: 'trade_send',
                id: id
            }
            this.memory.sendBuf = JSON.stringify(message)
        } else {
            // 你在干森么？
        }
    }

    /**
     * 注意 description 最多100字符
     * 
     * 多了是筛选掉嘛？
     */
    sendRules(resourceType) {
        const roomName = this.memory.connection.roomName
        const resourceRules = this.memory.rules.filter(item => item.type === resourceType)

        const message = {
            t: 'list',
            d: resourceRules.map(item => ({
                id: item.id,
                r: item.raito,
            }))
        }

        const res = this.terminal.send(RESOURCE_ENERGY, 1, roomName, JSON.stringify(message))

        return res === OK
    }

    // TODO
    doSendResource() {
        const roomName = this.memory.connection.roomName
        const sendBuf = this.memory.sendBuf

        // 翻 rules
        const res = this.terminal.send(RESOURCE_ENERGY, 1, roomName, sendBuf)

        return res === OK
    }

    // TODO
    doRecieveResource() {
        const roomName = this.memory.connection.roomName

        // 翻 rules
        const res = this.terminal.send(RESOURCE_ENERGY, 1, roomName)

        return res === OK
    }
}

module.exports = {
    select,
    TradeTerminal,
    run
}