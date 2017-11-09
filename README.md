# 模块信息

本模块用于在使用nodejs开发的微服务中集成服务注册能力。

本服务的服务注册依赖于`ms-service-reg`模块的服务注册和发现服务。

# 使用说明

## 模块引入

    var regsvc = require('ms-common-reg')

## 配置

本模块采用[Config](https://www.npmjs.com/package/config)库管理配置数据。

初始配置信息如下：

```json
{
    "service_node":{
        "basic":{
            "app":"base1",              // 服务所属的应用 必填
            "app_version":"1.0.0",      // 服务所属的应用的版本号
            "service":"common",         // 本服务的服务名 必填
            "service_version":"0.0.1",  // 本服务的服务版本号 必填
            "weight":"10"               // 本服务在负载均衡中的权重 必填
        },
        "storage": {
            "name":"zk",                // 服务注册表信息的存储媒介 必填
            "options":{
                "zk":{                  // zookeeper的链接信息 storage.name=zk时必填
                    "url":"192.168.8.3:2181,192.168.8.3:2182",
                    "options":{
                        "sessionTimeout": 2000 // 必填，决定临时节点失效删除周期
                    },
                    "timeout":3000
                },
                "root":"/TEST_MICRO/services"       // 服务注册表中微服务池的根路径 必填
            }
        },
        // server configurations 本服务的服务端口信息
        "server":{
            "protocal":"http",
            "host":"",
            "port":20002,
            "root":""                   // 微服务监听根目录
        }
    },
    "reg_svc":{     // 服务注册表的注册接口配置信息 必填
        "path":"http://localhost:20001/regist"
    },
    // log configurations   本服务的日志配置 必填
    "log":{
        "appenders": {
            "console":{"type": "console"}
        },
        "categories": { "default": { "appenders": ["console"], "level": "debug" } }
    },
    // system paths         
    "path":{        // 微服务的关键路径配置信息
        "controller":"./src/controller",
        "router":"./src/router"
    },
    "end":""
}
```

具体的配置说明参见示例。配置信息需要放到根目录的`config`目录下。

# 联系

微信：13811764611