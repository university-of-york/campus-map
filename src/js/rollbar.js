const RollbarLib = require('rollbar');

const Rollbar = (function() {

    // Set our Rollbar default config
    const _rollbarConfig = {
        accessToken: '8fc6b142956f48b39648d6132c95cce2',
        captureUncaught: true,
        captureUnhandledRejections: true,
        payload: {
            environment: (process.env.NODE_ENV !== 'production') ? 'staging' : 'production'
        }
    };

    // Add an event to Google Analytics
    const init = function(config) {
        config = config || _rollbarConfig;

        RollbarLib.init(config);
    };

    return {
        init
    };
}());
window.ROLLBAR = Rollbar || {};

