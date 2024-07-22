const {} = require('../src/index')

describe('测试 calc 计算函数', () => {

    const BuyRoom = 'W54S21'
    const SaleRoom = 'W1S1'


    // 提供 Game api,手搓
    global.Game = {
        map: {
            getRoomLinearDistance() {
                /** W54S21 -> W1S1 = 53 */
                return 53
            }
        }
    }

    test('1. 计算', () => {
        console.log(1)
    })
})