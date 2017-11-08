var config = require('config')
var log4js = require('log4js');
log4js.configure(config.get("log"));

var path = require('path');
const logger = require('@log4js-node/log4js-api').getLogger(path.basename(module.id));


var pNode = require('../../src/node');

pNode.once('ready',function(){logger.debug('here ready catched')})

var node = require('../../src/zk').init()
