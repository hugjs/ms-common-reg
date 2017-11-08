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

var request = require('request');
var cuid = require('cuid');
const internalIp = require('internal-ip');
const MAX_RETRY_TIME = 5;


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
    var basicCfg = config.get("service_node.basic");
    // 数据校验
    var keys = ['app','app_version','service','service_version'];
    if(_.pick(_.omitBy(basicCfg,_.isNil),keys).length < keys.length){
        throw new Error(100000,"配置文件参数错误")
    }
    this._id = cuid();
    this._status = SERVICE_STATUS.INIT;
    this._url = "";
    this._app = basicCfg.app;
    this._app_version = basicCfg.app_version;
    this._service = basicCfg.service;
    this._version = basicCfg.service_version;
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
 * 连接到某个存储服务，需要在具体的存储中实现
 */
Node.prototype.connect = function(){
    logger.debug('connect')
    var self = this;
    
    return new Promise((resolve, reject) => {
        logger.debug('connect in promise')
    });
}

/**
 * 服务添加到服务池，需要在具体的storage中实现
 */
Node.prototype.regToPool = function(){
    logger.debug('regToPool')
    var self = this;
    
    return new Promise((resolve, reject) => {
        logger.debug('regToPool in promise')
    });
}

/**
 * 公共服务注册实现
 */
Node.prototype.reg = function(options){
    logger.debug('reg', options)
    if(!options) options = {retry:0};
    ++options.retry;
    var self = this;
    
    return new Promise((resolve, reject) => {
        logger.debug('reg in Promise', options);
        request.post({
            url:config.get("reg_svc.path"), 
            header:{'content-type': 'application/json'},
            body:JSON.stringify({
                a:self._app,
                av:self._app_version,
                s:self._service, 
                sid:self._id, 
                sv:self._version
            })
        },function(err, resp, body){
            logger.debug('reg resp: ', body)
            var retry = function(err){
                if(options.retry <= MAX_RETRY_TIME){
                    setTimeout(function(){
                        var pms = typeof self.oldreg === 'function'?self.oldreg(options):self.reg(options);
                        pms.then(function(){resolve()})
                            .catch(function(e){reject(e)});
                    },1000*Math.pow(2,options.retry));
                    logger.info('Wait for %s seconds and retry.', Math.pow(2,options.retry));
                }else{
                    reject(err);
                }
            }
            if(err){
                retry(err);
                return;
            }
            try{
                var bodyObj = JSON.parse(body);
                if(bodyObj.status == 0) {
                    logger.info('service registed to the reg tree successfully.')
                    resolve();
                }
                else if(bodyObj.status == 10 ) retry(bodyObj);
                else reject(bodyObj);
            }catch(e){
                reject(err);
            }
        })
    });
}

module.exports = Node

_.forEach(SERVICE_STATUS, function (key) {
  module.exports[key] = SERVICE_STATUS[key];
});