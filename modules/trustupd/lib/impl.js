const log = require('log4js').getLogger(__filename.split('\\').pop().split('/').pop());
const Web3 = require('web3');
const { OrgIdResolver, httpFetchMethod } = require('@windingtree/org.id-resolver');
log.level = 'debug';

const updater = async (cached, resolver) => {
    try {
        const result = await cached.getOrgIds({});
        const orgids = result.rows.map(o => o.orgid).slice(0, 3);
        log.debug(`Got ${orgids.length} orgids to update`);
        
        // Verify all orgids
        const didResults = await Promise.all(
            orgids.map(orgid => resolver.resolve(`did:orgid:${orgid}`))
        );

        // Process verification results
        didResults.forEach(r => {
            console.log(JSON.stringify(r, null, 2));
        });

    } catch (error) {
        log.error(error.message);
    }
};

module.exports = async (cfg, cached) => {
    try {
        log.info('Starting of the Trust Updater');
        const config = cfg();
        const env = config.environments[config.currentEnvironment];

        const web3 = new Web3(env.provider);
        const resolver = new OrgIdResolver({
            web3, 
            orgId: env.orgidAddress
        });
        resolver.registerFetchMethod(httpFetchMethod);

        setInterval(() => updater(cached, resolver), env.updaterInterval * 60 * 1000);
    } catch (error) {
        log.error(error.message);
    }
};