var config = require('config')
var log4js = require('log4js');
log4js.configure(config.get("service_node.log"));

var path = require('path');
const logger = require('@log4js-node/log4js-api').getLogger(path.basename(module.id));


var node = require('../../src/zk/node').init()
