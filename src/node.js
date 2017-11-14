/**
 * 服务节点相关服务入口
 */
var config = require('config')
var noop = function(){}
var path = require('path');
const logger = require('@log4js-node/log4js-api').getLogger("node");
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
 * 服务节点封装
 * 
 * @param {Object} options 
 */
function Node(options) {
}

Node.prototype.init = async function(options){
    var self = this;
    Events.EventEmitter.call(self);
    var basicCfg = _.cloneDeep(config.get("service_node.basic"));
    // 数据校验
    var keys = ['app','app_version','service','service_version'];
    if(_.pick(_.omitBy(basicCfg,_.isNil),keys).length < keys.length){
        throw new Error(100000,"配置文件参数错误")
    }
    self._id = cuid();
    self._status = SERVICE_STATUS.INIT;
    self._url = "";
    self._app = basicCfg.app;
    self._app_version = basicCfg.app_version;
    self._service = basicCfg.service;
    self._version = basicCfg.service_version;
    self._enabled = 0;
    self._path = ROOT + "/" + self._app;
    if(!config.has("service_node.server")){
        throw new Error('service_node.server must be configured')
    }
    self._server = _.cloneDeep(config.get("service_node.server"));
    if(!self._server.protocal) self._server.protocal = "http";
    if(_.isEmpty(self._server.host)){
        try{
            self._server.host = await internalIp.v4();
        }catch(e){
            logger.error('Can not get the internal ip address');
            self._server.host = 'localhost';
        }
    }
    if(!_.isInteger(_.parseInt(self._server.port))){
        switch(self._server.protocal){
            case 'https':
                self._server.port = 443;
                break;
            default:
                self._server.port = 80;
        }
    }
    if(_.isEmpty(self._server.root)) self._server.root = "/";
    self._url = `${self._server.protocal}://${self._server.host}:${self._server.port}${self._server.root}`;
    logger.debug('NODE DATA: ', JSON.stringify(self))
    try{
        await self.connect();
        await self.regToPool();
        await self.reg();
        self._status = SERVICE_STATUS.STANDBY;
        logger.debug('Emitting service ready event');
        module.exports.emit('ready');
        
    }catch(e){
        logger.error('New Node failed: %o', e);
        process.exit();
    }
    return self;
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
        if(!config.has('reg_svc.path.reg')){
            reject(new Error('reg_svc.path.reg not configured'));
            return;
        }
        request.post({
            url:config.get("reg_svc.path.reg"), 
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

/**
 * 公共服务注册实现
 */
Node.prototype.activate = function(options){
    logger.debug('activate', options)
    if(!options) options = {retry:0};
    ++options.retry;
    var self = this;
    
    return new Promise((resolve, reject) => {
        logger.debug('enable in Promise', options);
        if(!config.has('reg_svc.path.activate')){
            reject(new Error('reg_svc.path.activate not configured'));
            return;
        }
        request.post({
            url:config.get("reg_svc.path.activate"), 
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

/**
 * 使得module对象支持时间的监听
 */
require('./events').EVENTS.forEach(function (key) {
    module.exports[key] = eventbus[key];
});