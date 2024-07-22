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

const Logger = {
    info(msg) {
        console.log(msg)
    },
    success(msg) {
        console.log(msg)
    },
    error(msg) {
        console.log(msg)
    }
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
        root.addBox({ height: 0.5 })
    }

    // 轮廓


    const root = getRenderBlockRoot({ marginTop: 3, marginLeft: 3, width: 25 })

    drawHeader()
    drawBody()
    drawFooter()

    const { x, y, height, width } = root.getPlaceholder()

    room.visual.rect(x, y, width, height, { fill: 'rgb(255,255,255)' })
    draws.forEach(d => d())
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
        return d.r.map(r => {
            return `id:${r.i}  ${r.r[1]} 【${r.r[0]}】 = ${r.r[3]} 【${r.r[2]}】   `
        })
    },
    footer(trade, d) {
        return [
            'Check this list and execute the script',
            `TP.select(${trade.terminal.room.name}).trade(...)`,
            `expire in 30 tick`
        ]
    }
}

/**
 * ~~卖方：计算total，保证给出的 total amount 一定可以发出去资源~~  
 * 计算最大可传输资源
 * @param {TradeTerminal} trade 
 * @param {ResourceConstant} type 类型
 * @param {number} amount 数量
 */
function calcMaxTransAmount(trade, type, amount) {
    const terminal = trade.terminal

    const distance = Game.map.getRoomLinearDistance(terminal.room.name, trade.memory.connection.roomName, true)

    let result = amount

    const energy = terminal.store.getUsedCapacity(RESOURCE_ENERGY)

    // 如果 type 是 energy 则单独计算
    if (type === RESOURCE_ENERGY) {
        result = Math.floor(energy / (2 - Math.exp(-distance / 30)))
        return result
    }

    const cost = Math.ceil(amount * (1 - Math.exp(-distance / 30)))

    // 运输费不够
    if (cost > energy) {
        // 减少 total amount
        amount = Math.min(Math.ceil(energy / (1 - Math.exp(-distance / 30))))
    }

    return result
}

/**
 * 
 * @param {TradeTerminal} trade 
 * @param {WaresListDTO} listData 
 */
function calcTradeRangesByList(trade, listData) {

    const amount = listData.a

    const from = trade.terminal.room.name
    const to = trade.memory.connection.roomName

    const res = []

    for (let r of listData.r) {
        /**
         * 这里讨论的是交换 listData.t 的 min / max 值
         * 要保证买家利益，当发送资源按汇率计算是小数时进位凑整。
         * a. 保证 发送/接收 资源 >= 1 , 求 最小交换资源 min
         * b. 用 商品amount 和交换物amount * raito 计算max值
         */
        let min = r.r > 1 ? Math.ceil(r.r) : Math.floor(1 / r.r)
        let max = Math.floor(calcMaxTransAmount(trade, r.t, Math.ceil(amount * r.r)) / r.r)
        res.push({
            min,
            minCost: Game.market.calcTransactionCost(min, from, to),
            max,
            maxCost: Game.market.calcTransactionCost(max, from, to),
        })
    }

    return res
}

global.topen = (room) => {
    open(room)
    select(room).memory.connection = {
        roomName: 'W1N1'
    }
}
global.tclose = close

global.calcProviderAmount = () => calcMaxTransAmount(select('W54S21'), RESOURCE_ENERGY, select('W54S21').terminal.store.getUsedCapacity(RESOURCE_ENERGY))


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

function open(roomName) {
    if (!!Memory[MEMORY_KEY].terminals[roomName]) {
        return Logger.error(`${roomName}'s terminal is already open`)
    }

    Memory[MEMORY_KEY].terminals[roomName] = {
        status: 'LISTEN',
        status_tick: Game.time,
        rules: [],
        sendBuf: undefined,
        connection: undefined
    }
}

function close(roomName) {
    if (!Memory[MEMORY_KEY].terminals[roomName]) {
        return Logger.error(`${roomName}'s terminal is not open`)
    }
    delete Memory[MEMORY_KEY].terminals[roomName]
}

/**
 * 
 * @param {string} roomName 
 */
function select(roomName) {
    if (!Memory[MEMORY_KEY].terminals[roomName]) {
        Logger.error(`${roomName}'s terminal is not open`)
        return undefined
    }
    return new TradeTerminal(roomName)
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
 * 每个状态的 handler
 * @type {Record<Status,(trade:TradeTerminal)=>void>}
 */
const handlers = {
    LISTEN(trade) {
        // 等待交易单信息
        for (let i = 0; i < letestMessage.length; i++) {
            const transaction = letestMessage[i]
            if (!trade.memory.connection.roomName && transaction.to === trade.terminal.room.name) {
                if (typeof transaction === 'object' && transaction.description.t === 'conn') {
                    /** @type {Messages['conn']} */
                    const message = transaction.description

                    const resourceType = message.d.t

                    // 发送 rules 列表
                    if (trade.sendRules(resourceType)) {
                        // 消费掉
                        letestMessage.splice(i, 1)

                        // 更新
                        trade.memory.connection = {
                            roomName: transaction.from,
                            contract: undefined
                        }

                        // 改变状态为 WAIT_SEND
                        transStatus(trade.memory, 'WAIT_SEND')
                        // 定时器
                        tradeFailTimer(trade, 10)
                        break;
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
                    /** @type {Messages['list']} */
                    const message = transaction.description

                    const data = message.d

                    // 画图
                    draw(Game.rooms[trade.terminal.room.name], data)

                    // 改变状态为 WAIT_TRADE
                    transStatus(trade.memory, 'WAIT_TRADE')

                    // 定时
                    tradeFailTimer(trade, 30)
                    break;
                }
            }
        }
    },
    /**
     * 等待发起者在控制台输入脚本，开启交易
     * 否则将被 30 tick 定时器状态置为 FAIL
     */
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
        Logger.error('Trade timeout')
        // 收尾
        this.COMPLETE(trade)
    }
}

/**
 * 交易对象
 */
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
        const terminal = Game.rooms[roomName].terminal
        const memory = Memory[MEMORY_KEY].terminals[roomName]

        this.terminal = terminal
        this.memory = memory
    }

    /**
     * 
     * @param {Rule[]} rules 
     * @returns 
     */
    setRules(rules) {
        // 判断是否交易中
        if (this.memory.connection) {
            return Logger.error(`There is a activating trade with ${this.memory.connection.roomName}`)
        }

        // 更新
        this.memory.rules = rules

        // 成功
        Logger.success('Set rule successful!')
    }

    _checkConnection() {
        return !!this.memory.connection
    }

    /**
     * 创建连接,询问对应资源
     */
    connect(roomName, resourceType) {
        // 检查是否已有连接
        if (this._checkConnection()) {
            return Logger.error(`There is a activating trade with ${this.memory.connection.roomName}`)
        }

        /** @type {Messages['conn']} */
        const message = {
            t: 'conn',
            d: { t: resourceType }
        }

        this.terminal.send(RESOURCE_ENERGY, 1, roomName, JSON.stringify(message))

        // 等待卖家发送资源列表
        transStatus(this.memory, 'WAIT_LIST')
        // 定时器
        tradeFailTimer(this, 10)
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
     * 发送 商品列表 数据，若 没有resourceRules 或 amount<1 ,则结束
     */
    sendRules(resourceType, onFail) {
        const roomName = this.memory.connection.roomName
        const resourceRules = this.memory.rules.filter(item => item.resourceType === resourceType)

        // 计算合适的amount
        const amount = calcMaxTransAmount(this, resourceType, this.terminal.store.getUsedCapacity(resourceType))

        /** @type {Messages['list']} */
        const message = {
            t: 'list',
            d: {
                t: resourceType,
                a: amount,
                r: resourceRules.map(item => ({
                    i: item.id,
                    t: item.exchangeResourceType,
                    r: item.raito
                }))
            }
        }

        const res = this.terminal.send(RESOURCE_ENERGY, 1, roomName, JSON.stringify(message))

        if (amount < 1) {
            // 余额不足
            return false
        }

        if (resourceRules.length === 0) {
            // 找不到商品
            return false
        }

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
    open,
    close,
    select,
    TradeTerminal,
    run
}
