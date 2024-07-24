# screeps-trade-protocol

A screeps room terminal protocol of resource trade

language: [EN](readme.MD) | [中文](readme-zh.MD)

----

This protocol is specifically designed to serve players' private terminal transactions. Sellers set their own exchange rules, and buyers can use the protocol to exchange resources according to the rules set by even throgh the seller is offline.

## usage

1. copy the ```src/index.js``` and rename it in your code like ```screeps_trade_protocol```.

2. add "run()" function in your loop, to listen incomming message.

```js
// main.js
const STP = require('screeps_trade_protocol')

global.STP=STP // set global api

module.export.loop=()=>{
    ...

    STP.run()
}

```

3. call open to start marketing

```STP.open("W1S1")```

4. as a buyer to start a trade

connect terminal
```STP.select("W1S1").connect("W2S2",RESOURCE_GHODIUM) // you are tring buy some G in W2S2 ```

read saler's rules list,and select one if you want

exec the script in Console

```STP.select("W1S1").trade("{id}",{amount})```


5. as a saler to set trade rules

```2```

## apis