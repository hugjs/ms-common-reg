/**
 * 服务节点相关服务入口
 */
var config = require('config')
var noop = function(){}
var path = require('path');
const logger = require('@log4js-node/log4js-api').getLogger("zk.node");
var Events  = require('events');
var Util    = require('util');
var _       = require('lodash');

var zookeeper = require('node-zookeeper-client');

var pNode = require('../node');
var zkOptions = config.has("service_node.storage.options.zk.options")?config.get("service_node.storage.options.zk.options"):null;
var client = zookeeper.createClient(config.get("service_node.storage.options.zk.url"), zkOptions);
/**
 * 全局的事件通过这个事件管理对象管理
 * 事件的数据，会包含相对多的信息
 * 
 */
var eventbus = new Events.EventEmitter();

Util.inherits(Node, Events.EventEmitter);

Util.inherits(Node, pNode);


/**
 * 服务节点对象，如果已经存在就直接返回
 */
exports.init = async function(options){
    if( !Node.singleton ) {
        Node.singleton = await new Node(options);
    }
    return Node.singleton;
}

/**
 * 服务节点封装
 * 
 * ### options 结构说明
 * 
 * options.app 本服务所属的应用名称 必填
 * options.app_version 本服务所属的应用版本号 必填
 * options.service 本服务的服务名称 必填
 * options.service_version 本服务的服务版本号 必填
 * 
 * @param {Object} options 
 */
function Node(options) {
    
    this.init.bind(this)(options);
    return this
}

/**
 * 获得服务节点的id
 */
Node.prototype.id = function(){
    return this._id;
}

/**
 * 获得节点的当前状态
 */
Node.prototype.status = function(){
    return this._status;
}

/**
 *  Connect to the zk server
 */
Node.prototype.connect = function(){
    logger.debug('connecting')
    var self = this;
    return new Promise((resolve, reject) => {
        var resoled = false;
        client.connect();
        client.on('connected',()=>{
            logger.debug('Connected')
            resolve();
            setInterval(()=>{client.exists("/",null, ()=>{})}, _.has(zkOptions,'sessionTimeout')?zkOptions.sessionTimeout:2000);
        });
        client.on('disconnected',async ()=>{
            // 断开连接之后自动重连
            logger.debug('disconnected')
            process.exit();
            try{
                await this.connect();
            }catch(e){
                logger.error(e);
            }
        });
        var timeout = config.has("service_node.storage.options.zk.timeout")?config.get("service_node.storage.options.zk.timeout"):3000;
        setTimeout(function(){
            (client && client.getState() == zookeeper.State.SYNC_CONNECTED) ||  reject();
        },timeout)
      });
}

/**
 * 注册到服务池
 */
Node.prototype.regToPool = function(){
    logger.debug('regToPool')
    var self = this;
    
    return new Promise((resolve, reject) => {
        logger.debug('regToPool in promise')
        client.mkdirp(
            self._path,zookeeper.CreateMode.PERSISTENT,
            function(err, p){
                logger.debug('mkdirp',p);
                if(err){
                    reject('app node creation failed', self._path);
                    return;
                }
                client.create(self._path + "/" + self._id, new Buffer(JSON.stringify({
                    url: self._url,
                    enabled: self._enabled,
                    version: self._version
                })),zookeeper.CreateMode.EPHEMERAL,function(err0){
                    if(err){
                        reject('service node creation failed', self._path + "/" + self._id);
                        return;
                    }
                    resolve();
                })
            }
        )
    });
}

// 先备份父类函数
// NOTE: 备份函数名必须是oldreg，否则在自动重试注册的时候，会导致promise里面的值被执行多次
Node.prototype.oldreg = Node.prototype.reg;

/**
 * 把微服务注册到服务注册树
 * 已经有默认的实现，特殊情况才需要扩展
 */
Node.prototype.reg = function(options){
    logger.debug('reg in zk')
    var self = this;

    return new Promise((resolve, reject) => {
        var prms = self.oldreg(options);
        prms.then(function(){
            logger.debug('reg in promise in zk')
            resolve();
        })
    });
}

Node.prototype.clean = function(){
    var self = this;
    client.remove(self._path + "/" + self._id,-1,function(err){
        if(err)logger.error(err);
        else logger.info("cleaned");

    })
}
