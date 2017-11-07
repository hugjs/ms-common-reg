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
var cuid = require('cuid');

var zookeeper = require('node-zookeeper-client');
const internalIp = require('internal-ip');

var client = zookeeper.createClient(config.get("service_node.storage.options.zk.url"));
/**
 * 全局的事件通过这个事件管理对象管理
 * 事件的数据，会包含相对多的信息
 * 
 */
var eventbus = new Events.EventEmitter();

Util.inherits(Node, Events.EventEmitter);

// Service Status
const SERVICE_STATUS = {
    INIT : 0,          // 初始化状态
    STANDBY : 1,       // 服务就绪，手动设置为disable的时候也是这个状态
    ENABLE : 2,        // 激活
  };

var rootInCfg = config.get("service_node.storage.options.root")
const ROOT = rootInCfg?rootInCfg:"/MICRO/services";

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
    Events.EventEmitter.call(this);
    // 数据校验
    var keys = ['app','app_version','service','service_version'];
    if(_.pick(_.omitBy(options,_.isNil),keys).length < keys.length){
        throw new Error(100000,"参数错误")
    }
    this._id = cuid();
    this._status = SERVICE_STATUS.INIT;
    this._url = "";
    this._app = config.get("service_node.basic.app");
    this._app_version = config.get("service_node.basic.app_version");
    this._service = config.get("service_node.basic.service");
    this._version = config.get("service_node.basic.service_version");
    this._enabled = 0;
    this._path = ROOT + "/" + this._app;
    this._server = config.get("service_node.server");
    if(!this._server.protocal) this._server.protocal = "http";
    if(!this._server.host){
        this._server.host = internalIp.v4.sync();
    }
    if(!this._server.port){
        switch(this._server.protocal){
            case 'https':
                this._server.port = 443;
                break;
            default:
                this._server.port = 80;
        }
    }
    if(!this._server.root) this._server.root = "/";
    this._url = `${this._server.protocal}://${this._server.host}:${this._server.port}${this._server.root}`;
    logger.debug('NODE DATA: ', JSON.stringify(this))
    var prms = this.connect();
    prms.then(this.regToPool.bind(this))
        .then(this.reg.bind(this))
        .catch((reason) => {
            logger.error('New Node failed: %s', JSON.stringify(reason));
        });
    return this;
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
        client.once('connected',()=>{
            logger.debug('Connected')
            resolve();
        });
        client.once('disconnected',()=>{
            // 断开连接之后自动重连
            logger.debug('disconnected')
            this.connect();
        });
        var timeout = config.get("service_node.storage.options.zk.timeout");
        setTimeout(function(){
            (client && client.getState() == zookeeper.State.SYNC_CONNECTED) ||  reject();
        },timeout?timeout:3000)
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

/**
 * 注册到服务注册树
 */
Node.prototype.reg = function(){
    logger.debug('reg')
    var self = this;
    return new Promise((resolve, reject) => {
        resolve();
    });

}

_.forEach(SERVICE_STATUS, function (key) {
  module.exports[key] = SERVICE_STATUS[key];
});

