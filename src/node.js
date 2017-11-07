/**
 * 服务节点相关服务入口
 */
var config = require('config')
var noop = function(){}
var path = require('path');
const logger = require('@log4js-node/log4js-api').getLogger("servicenode");
var Events  = require('events');
var Util    = require('util');

var _       = require('lodash');
var cuid = require('cuid');
const internalIp = require('internal-ip');


// Service Status
const SERVICE_STATUS = {
    INIT : 0,          // 初始化状态
    STANDBY : 1,       // 服务就绪，手动设置为disable的时候也是这个状态
    ENABLE : 2,        // 激活
  };

var rootInCfg = config.get("service_node.storage.options.root")
const ROOT = rootInCfg?rootInCfg:"/MICRO/services";

/**
 * 全局的事件通过这个事件管理对象管理
 * 事件的数据，会包含相对多的信息
 * 
 */
var eventbus = new Events.EventEmitter();

Util.inherits(Node, Events.EventEmitter);


/**
 * 初始化服务列表对象，如果已经存在就直接返回
 */
exports.init = function(options){
    if( !Node.singleton ) {
        Node.singleton = new Node(options);
    }
    return Node.singleton;
}

/**
 * 服务节点封装
 * 
 * @param {Object} options 
 */
function Node(options) {
}

Node.prototype.init = function(options){
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

Node.prototype.connect = function(){
    logger.debug('connect')
    var self = this;
    
    return new Promise((resolve, reject) => {
        logger.debug('connect in promise')
    });
}

Node.prototype.regToPool = function(){
    logger.debug('regToPool')
    var self = this;
    
    return new Promise((resolve, reject) => {
        logger.debug('regToPool in promise')
    });
}

Node.prototype.reg = function(){
    logger.debug('reg')
    var self = this;
    
    return new Promise((resolve, reject) => {
        logger.debug('reg in promise')
    });
}
module.exports = Node

_.forEach(SERVICE_STATUS, function (key) {
  module.exports[key] = SERVICE_STATUS[key];
});