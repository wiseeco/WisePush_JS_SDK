/**
 * wef-wisepush.js
 * WEF Push library
 * @since 2015. 07. 22.
 * @version 0.1
 * @author mimul@wiseeco.com
 * @last_modified
 */
var WEF = WEF || {};
WEF.wisepush = {
    client: null,
    lastMessageId: 1,
    lastSubId: 1,
    subscriptions: [],
    messages: [],
    connected: false,
    /**
     * 네크워크 단절 등 네트워크 연결이 끊어진다음 재 연결되었을 경우 Wisepush 재연결 처리하는 함수.
     */
    reconnect : function() {
        this.client = null;
        WEF.wisepush.connect();
    },
    /**
     * 최초 페이지 로딩 시 wisepush 서버 접속 처리 함수.
     */
    connect : function() {
        var host = 'www.wiseeco.com', port = 8083, clientId = 'clientId-' + WEF.func.randomString(10);
        this.client = new Paho.MQTT.Client(host, port, clientId);
        this.client.onConnectionLost = this.onConnectionLost;
        this.client.onMessageArrived = this.onMessageArrived;
        this.client.onConnect = this.onConnect;
        var options = {
            timeout: 3,
            keepAliveInterval: 10,
            cleanSession: true,
            useSSL: false,
            onSuccess: this.onConnect,
            onFailure: this.onFail
        };
        this.client.connect(options);
    },
    /**
     * 연결 실패시 호출되는 콜백 함수.
     */
    onFail : function (message) {
        WEF.wisepush.connected = false;
        //WEF.Alert.error("STATE : disconnected.");
        WEF.wisepush.reconnect();
    },
    /**
     * 연결 단절 시 호출되는 콜백 함수.
     */
    onConnectionLost : function (responseObject) {
        WEF.wisepush.connected = false;
        if (responseObject.errorCode !== 0) {
            console.log("onConnectionLost:" + responseObject.errorMessage);
        }
        WEF.wisepush.reconnect()
    },
    /**
     * 메세지 수신 시 호출되는 콜백 함수.
     */
    onMessageArrived : function (message) {
        var subscription = WEF.wisepush.getSubscriptionForTopic(message.destinationName);
        var messageObj = {
            'topic': message.destinationName,
            'retained': message.retained,
            'qos': message.qos,
            'payload': message.payloadString,
            'timestamp': moment(),
            'subscriptionId': subscription.id
        };
        console.log(message);
        messageObj.id = WEF.wisepush.renderMessage(messageObj);
        WEF.wisepush.messages.push(messageObj);
    },
    /**
     * 정상 연결 시 호출되는 콜백 함수.
     */
    onConnect : function () {
        WEF.wisepush.connected = true;
        //WEF.Alert.success("STATE : wiseeco.com connection succeeded.");
        console.log('wiseeco.com connection succeeded.');
        if (WEF.wisepush.subscriptions && WEF.wisepush.subscriptions.length > 0) {
            _.each(WEF.wisepush.subscriptions, function(ele, index) {
                WEF.wisepush.subscribe(ele.topic);
            });
        }
    },
    /**
     * wisepush 서버와 연결 해제.
     */
    disconnect : function () {
        this.client.disconnect();
    },
    /**
     * wisepush 서버에 메세지 발송.
     */
    publish : function (topic, payload, qos, retain) {
        if (!WEF.wisepush.connected) {
            WEF.Alert.error("STATE : disconnected.");
            return false;
        }
        var message = new Paho.MQTT.Message(payload);
        message.destinationName = topic;
        message.qos = qos;
        message.retained = retain;
        this.client.send(message);
        //WEF.wisepush.renderPublish(topic);
    },
    /**
     * 메세지(토픽 포함) 구독 요청.
     */
    subscribe : function (topic) {
        if (!WEF.wisepush.connected) {
            console.log('disconnected.');
            return false;
        }
        if (!topic) {
            console.log('Topic cannot be empty.');
            return false;
        }
        this.client.subscribe(topic, {qos: 1});
        var alreadyTopic = _.find(this.subscriptions, function(sub) {
            return sub.topic == topic;
        });
        if (alreadyTopic) {
            console.log('You are already subscribed to this topic.' + topic);
            return false;
        }
        var subscription = {'topic': topic, 'qos': 1};
        subscription.id = WEF.wisepush.renderSubscription(subscription);
        this.subscriptions.push(subscription);
        console.log(subscription);
        return true;
    },
    /**
     * 메세지(토픽 포함) 구독 해제 요청.
     */
    unsubscribe : function (topic) {
        this.client.unsubscribe(topic);
        WEF.wisepush.subscriptions = _.filter(WEF.wisepush.subscriptions, function (item) {
            return item.topic != topic;
        });
        WEF.wisepush.renderRemoveSubscriptionsMessages(id);
    },
    getSubscriptionForTopic : function (topic) {
        for (var i = 0, len = WEF.wisepush.subscriptions.length; i < len; i++) {
            if (WEF.wisepush.compareTopics(topic, WEF.wisepush.subscriptions[i].topic)) {
                return WEF.wisepush.subscriptions[i];
            }
        }
        return false;
    },
    compareTopics : function (topic, subTopic) {
        var pattern = subTopic.replace("+", "(.+?)").replace("#", "(.*)");
        var regex = new RegExp("^" + pattern + "$");
        return regex.test(topic);
    },
    renderMessages : function () {
        this.renderClearMessages();
        _.forEach(WEF.wisepush.messages, function (message) {
            message.id = WEF.wisepush.renderMessage(message);
        });

    },
    renderMessage : function (message) {
        var output = "topic=" + message.topic + "&msg=" + message.payload + '&qos=' + message.qos;
        $("pre#message-data")
            .prepend($("<p />").text(output));
        return WEF.wisepush.lastMessageId++;
    },
    renderSubscriptions : function () {
        WEF.wisepush.renderClearSubscriptions();
        _.forEach(WEF.wisepush.subscriptions, function (subs) {
            subs.id = WEF.wisepush.renderSubscription(subs);
        });
    },
    renderSubscription : function (subscription) {
        return WEF.wisepush.lastSubId++;
    },
    renderRemoveSubscriptionsMessages : function (id) {
        WEF.wisepush.messages = _.filter(WEF.wisepush.messages, function (item) {
            return item.subscriptionId != id;
        });
        WEF.wisepush.renderMessages();
    },
    renderClearMessages : function () {
        $("#message-data").val('');
    },
    renderClearSubscriptions : function () {
        $("#subtopic").val('');
    },
    renderClearForm : function ($form) {
        $form.children('.control-group').removeClass('success error');
    },
    renderPublish : function (topic) {
        WEF.Alert.reset();
        WEF.Alert.success(topic + " 으로 발행되었습니다.");
        WEF.wisepush.renderClearForm($('form#pubForm'));
        $("#message-data").scrollTop(0);
    }
}; // end WEF.wisepush
