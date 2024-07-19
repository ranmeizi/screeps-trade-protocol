const MEMORY_KEY = 'custom_market'

const test_d = {
    t: RESOURCE_UTRIUM,
    a: 2000,
    r: [
        { i: 1, r: [RESOURCE_UTRIUM, 1, RESOURCE_OXYGEN, 1] },
        { i: 2, r: [RESOURCE_UTRIUM, 5, RESOURCE_HYDROGEN, 14] }
    ]
}
const test_trade = {
    memory: {
        connection: {
            roomName: 'W10N5'
        }
    },
    terminal: {
        room: {
            name: 'W0N0'
        }
    }
}

global.test_log = () => {
    // log(test_d)
    draw(Game.rooms['W59S17'], test_d)
}

/**
 * @typedef UIStyle
 * @property {number} [marginTop] default=0
 * @property {number} [marginRight] default=0
 * @property {number} [marginBottom] default=0
 * @property {number} [marginLeft] default=0
 * @property {number} [height] default=0
 * @property {number} [width] default=0
 * @property {number} [fontSize] default=0
 * @property {number} [lineHeight] default=1.5
 */

/**
 * 获取块布局位置计算器 
 * @param {UIStyle} style
 * @returns 
 */
function getRenderBlockRoot({
    marginTop = 0,
    marginLeft = 0,
    marginRight = 0,
    marginBottom = 0,
    height = 0,
    width = 0
}) {
    let placeholder = {
        x: marginLeft,
        y: marginTop,
        height: height,
        width: width
    }
    return {
        /**
         * 设置一个 Box
         * @param {UIStyle} style 
         */
        addBox({
            marginTop = 0,
            marginLeft = 0,
            marginRight = 0,
            marginBottom = 0,
            height = 0,
        }) {
            const x = placeholder.x + marginLeft
            const y = placeholder.y + placeholder.height + marginTop
            placeholder.height += marginTop + height + marginBottom
            return {
                x,
                y
            }
        },
        /**
         * 设置一个 Text
         * @param {UIStyle} style 
         */
        addText({
            marginTop = 0,
            marginLeft = 0,
            marginRight = 0,
            marginBottom = 0,
            fontSize = 0.8,
            lineHeight = 1.5
        }) {
            const x = placeholder.x + marginLeft
            const temp = fontSize * (lineHeight - 1)
            const y = placeholder.y + placeholder.height + marginTop + temp

            placeholder.height += marginTop + fontSize * lineHeight + marginBottom
            return {
                x,
                y
            }
        },
        getPlaceholder() {
            return placeholder
        }
    }
}

/**
 * 画图
 * @param {Room} room 
 * @param {WaresListDTO} data 
 */
function draw(room, data) {
    if (!data) {
        return
    }

    const draws = []

    function drawHeader() {
        const header = renderTexts.header(test_trade, test_d)
        root.addBox({ height: 1 })
        for (const line of header) {
            const fontSize = 1.2
            const { x, y } = root.addText({ fontSize: fontSize, marginLeft: 1 })
            draws.push(() => room.visual.text(line, x, y, { color: 'black', font: fontSize, align: 'left', strokeWidth: 0.5 }))
        }
        const { x, y } = root.addBox({ height: 0.2, marginBottom: 0.5 })

        draws.push(() => room.visual.line(x, y, x + 25, y, { color: 'black', width: 0.2 }))
    }
    function drawBody() {
        const body = renderTexts.body(test_trade, test_d)
        root.addBox({ height: 1 })
        for (const line of body) {
            const fontSize = 1
            const { x, y } = root.addText({ fontSize: fontSize, marginLeft: 1 })
            draws.push(() => room.visual.text(line, x, y, { color: 'black', font: fontSize, align: 'left', strokeWidth: 0.5 }))
        }
        root.addBox({ height: 2.5 })
    }
    function drawFooter() {
        const footer = renderTexts.footer(test_trade, test_d)

        for (const line of footer) {
            const fontSize = 0.8
            const { x, y } = root.addText({ fontSize: fontSize, marginLeft: 1 })
            draws.push(() => room.visual.text(line, x, y, { color: 'black', font: fontSize, align: 'left', strokeWidth: 0.5 }))
        }
        root.addBox({ height: 1 })
    }

    // 轮廓


    const root = getRenderBlockRoot({ marginTop: 3, marginLeft: 3, width: 25 })

    drawHeader()
    drawBody()
    drawFooter()

    const { x, y, height, width } = root.getPlaceholder()

    room.visual.rect(x, y, width, height, { fill: 'rgb(255,255,255)' })
    draws.forEach(d=>d())
}

/**
 * @type {Record<'header'|'body'|'footer',(trade:TradeTerminal,d:WaresListDTO)=>string[]>}
 */
const renderTexts = {
    header(trade, d) {
        return [
            `${trade.memory.connection.roomName}'s wares trade rule about ${d.t}`,
            `total ${d.t} : ${d.a}`
        ]
    },
    body(trade, d) {
        return d.r.map(r => `id:${r.i}  ${r.r[1]} 【${r.r[0]}】 = ${r.r[3]} 【${r.r[2]}】   `)
    },
    footer(trade, d) {
        return [
            'Check this list and execute the script',
            `TP.select(${trade.terminal.room.name}).trade(...)`,
            `expire in 30 tick`
        ]
    }
}

function log(data) {
    const header = renderTexts.header(test_trade, test_d)
    const body = renderTexts.body(test_trade, test_d)
    const footer = renderTexts.footer(test_trade, test_d)

    const text = header.concat(body).concat(footer).join('\n')

    console.log(text)
}

/**
 * 计算能量消耗
 */
function calcEnergy() {

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
        // log timeout
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

function createContract(rule) {

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

    // /**
    //  * terminal
    //  * @memberof TradeTerminal
    //  * @type {StructureTerminal}
    //  */
    // terminal

    // /**
    //  * @memberof TradeTerminal
    //  * @type {TradeTerminalMemory | undefined}
    //  */
    // memory

    constructor(roomName) {
        const { terminal, memory } = select(roomName)

        this.terminal = terminal
        this.memory = memory
    }

    setRules() {
        // 判断是否交易中 TODO
        if (1 === 1) {
            return
        }
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
        if (this.memory.status !== 'WAIT_TRADE') {
            // 你在干森么？
            return
        }

        // 发送
        const message = {
            t: 'trade_send',
            id: id
        }
        this.memory.sendBuf = JSON.stringify(message)
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
