const MEMORY_KEY = 'custom_market'

function checkMemory() {
    if (!Memory[MEMORY_KEY]) {
        Memory[MEMORY_KEY] = {
            lastIncomingId: '',
            blackList: [],
            terminals: {}
        }
    }
}

/**
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
        for (let transaction of letestMessage) {
            if (!trade.memory.connection.roomName && transaction.to === trade.terminal.room.name) {
                if (transaction.description.t === 'conn') {
                    const resource = transaction.description.r

                    // 发送 rules 列表
                    // send

                    // 改变状态为 WAIT_SEND
                    transStatus(trade.memory,'WAIT_SEND')
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
                    // draw

                    // 改变状态为 WAIT_TRADE
                    transStatus(trade.memory,'WAIT_TRADE')
                }
            }
        }
    },
    WAIT_TRADE(trade) {
        // 检查 sendBuf 有没有内容
        if(trade.memory.sendBuf){
            // 发送
            // send

            transStatus(trade.memory,'WAIT_RECIEVE')
        }
    },
    WAIT_SEND(trade) {
         // 等待交易单信息中的 list 数据 画图
         for (let transaction of letestMessage) {
            if (trade.memory.connection.roomName === transaction.from && transaction.to === trade.terminal.room.name) {
                if (transaction.description.t === 'list') {
                    const data = transaction.description.d

                    // 发资源吧
                    // draw

                    // 改变状态为 
                    transStatus(trade.memory,'COMPLETE')
                }
            }
        }
    },
    WAIT_RECIEVE(trade) {
        // 等待交易单信息中的 list 数据 画图
        for (let transaction of letestMessage) {
            if (trade.memory.connection.roomName === transaction.from && transaction.to === trade.terminal.room.name) {
                if (transaction.description.t === 'list') {
                    const data = transaction.description.d

                    // 发资源吧
                    // draw

                    // 改变状态为 COMPLETE
                    transStatus(trade.memory,'COMPLETE')
                }
            }
        }
    },
    COMPLETE(trade) {
        // 收尾

        transStatus(trade.memory,'LISTEN')
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

    }

    /**
     * 
     */
    trade() {
        if (this.memory.status === 'WAIT_TRADE') {
            // 发送
        } else {
            // 你在干森么？
        }
    }
}

module.exports = {
    select,
    TradeTerminal,
    run
}