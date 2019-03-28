
const Notices = (function() {

    // --------------------------------------------------

    const _cookiePrefix = 'global-notice-status';
    let _closeBtnHTML = '<button type=\'button\' class=\'c-alert__close js-alert-close\' aria-label=\'Close\'>&times;</button>';
    let _noticeHTML = '<div class=\'c-global-notice {0}\'>{x}{1}{2}</div>';
    let _noticeTitle = '<h2 class=\'c-global-notice__title\'>{0}</h2>';

    // --------------------------------------------------

    const init = function( config ) {

        if( !config.globalNotice ) return false;

        initNotice( config.globalNotice );
    };

    // --------------------------------------------------

    const initNotice = function( options ) {

        // Check cookie status and abandon if "closed"
        if( !checkNoticeCookie( options.id ) ) return false;

        // Build our notice element + content

        let $placementEl = $( options.placeBeforeElement );

        let title = options.title ? stringReplace( _noticeTitle , [options.title] ) : '';

        let outputHTML = stringReplace(_noticeHTML, [
            options.noticeModifierClasses,
            title,
            options.description
        ]);

        outputHTML = outputHTML.replace( '{x}' , options.closeable ? _closeBtnHTML : '' );

        $placementEl.before( outputHTML );
        
        // Listen for clicks on the close control
        $( '.js-alert-close' ).on( 'click' , function( e ) {
            e.preventDefault();
            setNoticeCookie( options.id , 'closed' );
            $( '.c-global-notice' ).hide();
        } );

    };

    // --------------------------------------------------
    // Set a cookie to stash the closed/open status

    function setNoticeCookie( noticeId , status ) {

        setCookie( `${ _cookiePrefix }__${ noticeId }` , status , 7 );

    };

    // --------------------------------------------------

    function checkNoticeCookie( noticeId ) {
        
        if( getCookie( `${ _cookiePrefix }__${ noticeId }` ) === 'closed' ) {
            return false;
        }

        return true;
    };

    // --------------------------------------------------
    // Cookies - todo: needs abstracting

    function setCookie(cookieName, value, expires) {
        let expiresStr = '';
        if(expires) {
            let d = new Date();
            d.setTime(d.getTime() + (expires * 1000 * 60 * 60 * 24 ));
            expiresStr = 'expires=' + d.toUTCString() + ';';
        }
        document.cookie = cookieName + '=' + value + ';' + expiresStr + 'path=/';
    }
    
    function getCookie(cookieName) {
        let name = cookieName + '=';
        let decodedCookie = decodeURIComponent(document.cookie);
        let ca = decodedCookie.split(';');
        for(let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) === 0) {
                return c.substring(name.length, c.length);
            }
        }
        return '';
    }

    // --------------------------------------------------

    function stringReplace(template, replaceArr) {

        for(let i = 0; i < replaceArr.length; i++) {
            let placeholder = '{' + i.toString() + '}';
            template = template.replace(placeholder, replaceArr[i]);
        }

        return template;
    };

    // --------------------------------------------------

    return {
        init
    };

    // --------------------------------------------------

}());

export default Notices;
