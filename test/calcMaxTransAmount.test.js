const { TFn, select } = require('../src/index')

describe('测试 calcMaxTransAmount 计算函数', () => {

    const BuyRoom = 'W54S21'
    const SaleRoom = 'W1S1'

    let amount = 0


    // 提供 Game api,手搓
    global.Game = {
        map: {
            getRoomLinearDistance() {
                /** W54S21 -> W1S1 = 53 */
                return 53
            }
        },
        rooms: {
            [BuyRoom]: {
                terminal: {
                    room: {
                        name: BuyRoom
                    },
                    store: {
                        getUsedCapacity() {
                            return amount
                        }
                    }
                }
            }
        },
        market: {
            calcTransactionCost(amount, roomName1, roomName2) {
                return Math.ceil(amount * (1 - Math.exp(-53 / 30)))
            }
        }
    }

    global.RESOURCE_UTRIUM = 'U'
    global.RESOURCE_ENERGY = 'energy'

    global.Memory = {
        custom_market: {
            lastIncomingId: '',
            terminals: {
                [BuyRoom]: {
                    status: 'LISTEN',
                    status_tick: Game.time,
                    rules: [],
                    sendBuf: undefined,
                    connection: {
                        roomName: SaleRoom
                    }
                }
            }
        }
    }

    test('1. 计算store energy 0 接近于0', () => {
        amount = 0
        const res = TFn.calcMaxTransAmount(select(BuyRoom), 'energy', amount)
        const total = res + Game.market.calcTransactionCost(res, BuyRoom, SaleRoom)
        console.log('total', total)
        expect(total).toBe(0)
    })

    test('2. 计算store energy 5000 接近于5000但小于等于5000,误差1', () => {
        amount = 5000
        const res = TFn.calcMaxTransAmount(select(BuyRoom), 'energy', amount)
        const total = res + Game.market.calcTransactionCost(res, BuyRoom, SaleRoom)
        console.log('total', total)
        expect(total).toBeLessThanOrEqual(amount)
        expect(total).toBeGreaterThanOrEqual(amount - 1)
    })

    test('3. 计算store energy 12345 接近于12345但小于等于12345,误差1', () => {
        amount = 12345
        const res = TFn.calcMaxTransAmount(select(BuyRoom), 'energy', amount)
        const total = res + Game.market.calcTransactionCost(res, BuyRoom, SaleRoom)
        console.log('total', total)
        expect(total).toBeLessThanOrEqual(amount)
        expect(total).toBeGreaterThanOrEqual(amount - 1)
    })
})
