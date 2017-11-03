/**
 * 服务节点相关服务入口
 */
var noop = function(){}
var path = require('path');
const logger = require('@log4js-node/log4js-api').getLogger(path.basename(module.id));
var Events  = require('events');
var Util    = require('util');

var _       = require('lodash');
var cuid = require('cuid');
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
    Events.EventEmitter.call(this);
    this._id = cuid();
    this._status = SERVICE_STATUS.STANDBY;
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



module.exports = Node;
_.forEach(SERVICE_STATUS, function (key) {
  module.exports[key] = SERVICE_STATUS[key];
});