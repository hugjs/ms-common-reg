## Change Log

### 0.0.6
- 去掉zk/index中对于zk连接状态更新的日志

### 0.0.5
- server配置项放到根目录下

### 0.0.4 
- 增加自动激活节点的配置能力
- 配置文件采用yaml格式编写

### 0.0.3
- 增加zk连接的健壮性

### 0.0.2
- 增加zk的sessionTimeout配置的支持，使得连接失效之后，临时节点能尽快从zk中删除

### 0.0.1

- Finished the service registration implementation for zookeeper