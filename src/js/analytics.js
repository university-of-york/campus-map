const MapAnalytics = (function() {

    // Placeholder for the name of the tracker that Tag Manager loads
    let _gaTracker = false;

    // Add an event to Google Analytics
    const addAnalyticsEvent = function(action, label, value) {
        // Analytics hasn't loaded yet
        if (typeof ga === 'undefined') {
            return false;
        }
        if (_gaTracker === false) {
            // Get the name of the tracker that Tag Manager loads
            ga(function() {
                let trackers = ga.getAll();
                _gaTracker = trackers[0].get('name');
            });
        }
        ga(_gaTracker + '.send', 'event', 'Map', action, label, value);
    };

    return {
        addAnalyticsEvent
    };
}());
export default MapAnalytics;

