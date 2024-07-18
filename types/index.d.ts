interface Memory {
    custom_market: {
        // 搜索的上一条 incomingTransaction id
        lastIncomingId: string,
        blackList: string[],
        terminals: Record<string, TradeTerminalMemory>
    }
}

type Trade = {

}

type Status = 'LISTEN' | 'WAIT_LIST' | 'WAIT_TRADE' | 'WAIT_SEND' | 'WAIT_RECIEVE' | 'COMPLETE' | 'FAIL'

type Rule = {
    id: '',
    type: string,
    /**
     * 每一定量商品需要的等价物数量
     * 商品 type ， 数量 ，等价物 type ，数量
     */
    raito: [string, number, string, number]
}

type MessageTypes='list'|'trade_send'|'trade_recieve'

type Message<T>={
    t:MessageTypes,
    d:T
}

type WaresListDTO={
    /** type-资源类型 */
    t:string
    /** amount-资源数 */
    a:number
    /** rules-规则 */
    r:{
        /** id */
        i:number,
        /** raito */
        r: [string, number, string, number]
    }[]
}

/** 交易合同 */
type Contract = {
    sendType: string,
    sendAmount: number,
    recieveType: string,
    recieveAmount: number
}

type TradeTerminalMemory = {
    /**
     * 状态
     */
    status: Status

    /**
     * 状态改变tick
     */
    status_tick: number
    /**
     * 商品交换规则
     */
    rules: Rule[]
    /**
     * 发送缓冲区
     */
    sendBuf?: string

    connection?: {
        roomName: string,
        contract?: Contract
    }
}

interface ITradeTerminal {
    /**
     * 创建连接
     */
    connect(roomName: string): void

    /**
     * 设置规则
     * 
     * 修改 memory rules
     */
    setRules(): void
}