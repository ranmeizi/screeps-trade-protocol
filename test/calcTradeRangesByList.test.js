const { TFn, select } = require('../src/index')

describe('测试 calcTradeRangesByList 函数', () => {
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
                        getUsedCapacity(type) {
                            if (type === 'energy') {
                                return 5000
                            } else if (type === 'G') {
                                return 10000
                            }else if (type ==='K'){
                                return 5000
                            }else{
                                return 0
                            }
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

    test('1. ', () => {
        /** @type {WaresListDTO} */
        const listData = {
            a: 2000,
            t: 'G',
            r: [
                {
                    i: '1',
                    t: 'energy',
                    r: 512.1123
                },
                {
                    i: '2',
                    t: 'K',
                    r: 12.7528
                },
                {
                    i: '3',
                    t: 'H',
                    r: 13.4443
                }
            ]
        }

        const res = TFn.calcTradeRangesByList(select(BuyRoom),listData)

        console.log('res',res)
    })
})