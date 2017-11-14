
var config = require('config')
var noop = function(){}
var path = require('path');
const logger = require('@log4js-node/log4js-api').getLogger("app.index");
require('./log')

var pNode = require('./src/node')
var strg = require("./src/" + config.get('service_node.storage.name'))

logger.info('Starting the service node......')

pNode.on('ready',function(){
    logger.info('Service Ready.....');
    if(config.has('service_node.basic.activate')&& config.get('service_node.basic.activate')){
        strg.init().activate();
    }

    // require("./app.js")
    // logger.info('Web API Listening on Port %s .....', config.get("server.port"));
})

strg.init(config.get('service_node.storage.options'))

module.exports = {
    node: pNode,
}