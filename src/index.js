const MEMORY_KEY = 'custom_market'

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
 * @param {TradeTerminal} trade 
 * @param {WaresListDTO} data 
 */
function draw(trade, data) {
    if (!data) {
        return
    }
    const room = trade.terminal.room

    const draws = []

    // 给买方看的一些数据
    const TrialBalance = trade.memory.connection.TrialBalance

    function drawHeader() {
        const header = renderTexts.header(trade, data)
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
        const body = renderTexts.body(trade, data)
        root.addBox({ height: 1 })
        for (let i = 0; i < body.length; i++) {
            const line = body[i]
            const {
                minRecv,
                maxRecv,
                minSend,
                maxSend,
                minSendCost,
                maxSendCost
            } = TrialBalance[data.r[i].i]
            const fontSize = 1
            const { x, y } = root.addText({ fontSize: fontSize, marginLeft: 1 })

            draws.push(() => room.visual.text(line, x, y, { color: 'black', font: fontSize, align: 'left', strokeWidth: 0.5 }))

            let right = ''
            const recvType = data.t
            const sendType = data.r[i].t
            // 判断可不可交易
            if (minRecv === 0) {
                // 不可交易
                right = `can't exchange 「${recvType}」 with 「${sendType}」`
                draws.push(() => room.visual.text(right, x + 12, y, { color: 'black', font: 0.8, align: 'left', strokeWidth: 0.5 }))
            } else {
                let footer1 = `exchange range: ${minRecv} 「${recvType}」 ~ ${maxRecv} 「${recvType}」`
                let line1 = root.addText({ fontSize: 0.6, marginLeft: 1 })
                draws.push(() => room.visual.text(footer1, line1.x, line1.y, { color: 'black', font: 0.6, align: 'left', strokeWidth: 0.5 }))
                let footer2 = `cost range: ${minSend} 「${sendType}」 ~ ${maxSend} 「${sendType}」  and   ${minSendCost} 「${RESOURCE_ENERGY}」 ~ ${maxSendCost} 「${RESOURCE_ENERGY}」`
                let line2 = root.addText({ fontSize: 0.6, marginLeft: 1 })
                draws.push(() => room.visual.text(footer2, line2.x, line2.y, { color: 'red', font: 0.6, align: 'left', strokeWidth: 0.5 }))
            }
        }
        root.addBox({ height: 2.5 })
    }
    function drawFooter() {
        const footer = renderTexts.footer(trade, data)

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
            return `id:${r.i}  1[${d.t}] = ${r.r}[${r.t}]`
        })
    },
    footer(trade, d) {
        return [
            'Check this list and execute the script in Console',
            `STP.select("${trade.terminal.room.name}").trade("{id}",{amount})`,
            `expire in ${35-(Game.time - trade.memory.status_tick)} tick`
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

    /** @type {TradeTerminalMemory['connection']['TrialBalance']} */
    const res = {}

    for (let r of listData.r) {

        // 计算最大可发送的交换物 maxSend

        /** 不计算发送损耗的最大值 */
        const maxPureAmount = Math.min(trade.terminal.store.getUsedCapacity(r.t), Math.ceil(amount * r.r))

        /** 计算损耗的最大值 maxSend */
        const maxSend = Math.ceil(calcMaxTransAmount(trade, r.t, maxPureAmount))

        // 交换商品资源的最大值 为 0 则无法交易 maxRecv 
        const maxRecv = Math.floor(maxSend / r.r)

        // 满足 交换资源必须 >1 的最小值 与 交换商品资源的最大值 比较取最小 minRecv
        const minRecv = Math.min(r.r > 1 ? 1 : Math.floor(1 / r.r), maxRecv)

        // minRecv 计算 minSend
        const minSend = Math.ceil(minRecv * r.r)

        // 使用 minSend maxSend 计算 minSendCost maxSendCost

        const minSendCost = Game.market.calcTransactionCost(minSend, from, to)
        const maxSendCost = Game.market.calcTransactionCost(maxSend, from, to)

        res[r.i]={
            minRecv,
            maxRecv,
            minSend,
            maxSend,
            minSendCost,
            maxSendCost
        }
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
    if (trade.memory.status_tick + tickTimeout < Game.time) {
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

/**
 * 创建契约
 * @param {TradeTerminal} trade 
 * @param {string} id 
 * @param {number} amount 
 * @returns {Contract} 
 */
function createContractSend(trade, id, amount) {
    const wares = trade.memory.connection.wares
    const recieveType = wares.t
    const recieveAmount = amount
    const rule = wares.r.find(item => item.i = id)
    const sendType = rule.t
    const sendAmount = Math.ceil(rule.r * amount)

    return {
        sendType,
        sendAmount,
        recieveType,
        recieveAmount
    }
}

/**
 * 
 * @param {TradeTerminal} trade 
 * @param {*} id 
 * @param {*} amount 
 */
function createContractRecieve(trade, id, amount) {
    const rule = trade.memory.rules.find(item => item.id === id)

    const recieveType = rule.resourceType
    const recieveAmount = amount

    const sendType = rule.exchangeResourceType
    const sendAmount = Math.ceil(rule.raito * amount)

    return {
        sendType,
        sendAmount,
        recieveType,
        recieveAmount
    }

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
            if (!trade.memory.connection && transaction.to === trade.terminal.room.name) {
                if (typeof transaction === 'object' && transaction.description.t === 'conn') {
                    /** @type {Messages['conn']} */
                    const message = transaction.description

                    const resourceType = message.d.t

                    // 更新
                    trade.memory.connection = {
                        roomName: transaction.from,
                        contract: undefined
                    }


                    // 发送 rules 列表
                    if (trade.sendRules(resourceType)) {
                        // 消费掉
                        letestMessage.splice(i, 1)


                        // 改变状态为 WAIT_SEND
                        transStatus(trade.memory, 'WAIT_SEND')
                        
                        break;
                    }
                }
            }
        }
    },
    WAIT_LIST(trade) {
        // 等待交易单信息中的 list 数据 画图
        for (let i = 0; i < letestMessage.length; i++) {
            const transaction = letestMessage[i]
            if (trade.memory.connection.roomName === transaction.from && transaction.to === trade.terminal.room.name) {
                if (transaction.description.t === 'list') {
                    /** @type {Messages['list']} */
                    const message = transaction.description

                    const data = message.d

                    // 保存
                    trade.memory.connection.wares = data

                    // 试算
                    trade.memory.connection.TrialBalance = calcTradeRangesByList(trade, data)

                    // 消费掉
                    letestMessage.splice(i, 1)

                    // 改变状态为 WAIT_TRADE
                    transStatus(trade.memory, 'WAIT_TRADE')

                    break;
                }
            }
        }
        // 定时
        tradeFailTimer(trade, 11)
    },
    /**
     * 等待发起者在控制台输入脚本，开启交易
     * 否则将被 30 tick 定时器状态置为 FAIL
     */
    WAIT_TRADE(trade) {
        const data = trade.memory.connection.wares
        // 画图
        draw(trade, data)
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
        // 定时
        tradeFailTimer(trade, 35)
    },
    WAIT_SEND(trade) {
        // 等待交易单信息中的 list 数据 画图
        for (let i = 0; i < letestMessage.length; i++) {
            const transaction = letestMessage[i]
            if (trade.memory.connection.roomName === transaction.from && transaction.to === trade.terminal.room.name) {
                if (transaction.description.t === 'trade_send') {

                    // 消费掉
                    letestMessage.splice(i, 1)

                    /** @type {Messages['trade_send']} */
                    const message = transaction.description

                    // 本地创建 contract
                    const contract = createContractRecieve(trade, message.d.i, message.d.a)

                    // 发资源吧
                    if (trade.doRecieveResource(contract)) {
                        // 改变状态为 
                        transStatus(trade.memory, 'COMPLETE')
                        break;
                    } else {
                        transStatus(trade.memory, 'FAIL')
                    }
                }
            }
        }
        // 如果有的话，在 timeout 之前继续

        // 定时器
        tradeFailTimer(trade, 35)
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
        // 定时器
        tradeFailTimer(trade, 11)
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
        handlers.COMPLETE(trade)
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
        this.memory.rules = rules.map(item => {
            return {
                ...item,
                id: _.uniqueId()
            }
        })

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

        if (this.terminal.send(RESOURCE_ENERGY, 1, roomName, JSON.stringify(message)) === OK) {
            // 等待卖家发送资源列表
            // 更新
            this.memory.connection = {
                roomName: roomName,
                contract: undefined
            }

            transStatus(this.memory, 'WAIT_LIST')
        }

        // 定时器
        tradeFailTimer(this, 10)
    }

    /**
     * 开始交易
     */
    trade(id, amount) {
        if (this.memory.status !== 'WAIT_TRADE') {
            // 你在干森么？
            return Logger.error('trade fail')
        }

        // 与试算内容校验
        if (this.memory.connection.TrialBalance && this.memory.connection.TrialBalance[id]) {
            const range = this.memory.connection.TrialBalance[id]

            if (amount < range.minRecv || amount > range.maxRecv) {
                return Logger.error('trade fail, invalid amount')
            }
            // 创建契约
            this.memory.connection.contract = createContractSend(this, id, amount)

            // 发送
            const message = {
                t: 'trade_send',
                d: { i: id, a: amount }
            }

            this.memory.sendBuf = JSON.stringify(message)
        } else {
            // 你在干森么？
            return Logger.error('trade fail, invalid id')
        }
    }

    /**
     * 注意 description 最多100字符
     * 发送 商品列表 数据，若 没有resourceRules 或 amount<1 ,则结束
     */
    sendRules(resourceType) {
        if (!this.memory.connection) {
            return
        }
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

        const contract = this.memory.connection.contract

        // 发送
        const res = this.terminal.send(contract.sendType, contract.sendAmount, roomName, sendBuf)

        return res === OK
    }

    /**
     * @param {Contract} contract 
     * @returns 
     */
    doRecieveResource(contract) {
        const roomName = this.memory.connection.roomName

        /** @type {Messages['trade_recieve']} */
        const message = {
            t: 'trade_recieve',
            d: {}
        }

        // 发送
        const res = this.terminal.send(contract.recieveType, contract.recieveAmount, roomName, JSON.stringify(message))

        return res === OK
    }
}

module.exports = {
    open,
    close,
    select,
    TradeTerminal,
    run,
    TFn: {
        calcMaxTransAmount,
        calcTradeRangesByList
    }
}
