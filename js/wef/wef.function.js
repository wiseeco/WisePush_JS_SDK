/**
 * wef.function.js
 * WEF javascript function library
 * @since 2013. 05. 06.
 * @version 0.1
 * @author sjune@wiseeco.com
 * @last_modified
*/

var WEF = WEF || {};
WEF.func = {
    /**
     * 공백 여부 체크
     */
    isEmpty : function (str) {
        return (!str || 0 === str.length);
    },

    /**
     * 빈칸 여부 체크
     */
    isBlank : function(str) {
        return (!str || /^\s*$/.test(str));
    },
    /**
     * html 디코딩
     * ex) $.htmlDecode("R&amp;D"); -> R&D
     * @param string
     * @return html decoded string
     */
    htmlDecode : function(str) {
        return $('<div/>').html(str).text();
    },
    /**
     * checkboxToggleAll
     * 테이블 td의 체크박스 전체선택/해제 기능
     * ex) WEF.func.checkboxToggleAll(this, 'empNoCheck');
     * @param 전체 체크박스 대상 object
     * @param checkbox tag name
     */
    checkboxToggleAll : function(target, tagName) {
        $("input[name="+tagName+"]:checkbox")
            .prop("checked", $(target).is(":checked"));
    },
    /**
     * 페이지 이동
     */
    goPage : function(url) {
        location.href = url;
    },
    randomString : function(length) {
        var text = '';
        var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (var i = 0; i < length; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        return text;
    }
};

WEF.Alert = {
    reset : function() {
        var $container = $("#alert-container");
        $container.find('.alert').hide();
        return $container;
    },
    success : function(message) {
        WEF.Alert.reset()
            .find('.alert-success').fadeIn('slow')
            .end().find('.alert-message').text(message);
    },
    error : function(message) {
        WEF.Alert.reset()
            .find('.alert-error').fadeIn('slow')
            .end().find('.alert-message').text(message);
    },
    info : function(message) {
        WEF.Alert.reset()
            .find('.alert-info').fadeIn('slow')
            .end().find('.alert-message').text(message);
    }
};
