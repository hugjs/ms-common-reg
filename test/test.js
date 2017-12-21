/**
 * 服务节点相关服务入口
 */
var config = require('config')
var noop = function(){}
var path = require('path');
const logger = require('@log4js-node/log4js-api').getLogger("test");
var Events  = require('events');
var Util    = require('util');
var _       = require('lodash');
require('../log')

const {node} = require('..')

node.on('ready',function(){
    logger.info('Service Ready.....');
})