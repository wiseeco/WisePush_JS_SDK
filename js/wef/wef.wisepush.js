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

    reconnect : function() {
        this.client = null;
        //WEF.Alert.reset();
        WEF.wisepush.renderClearForm($('form#pubForm'));
        WEF.wisepush.renderClearForm($('form#subForm'));
        WEF.wisepush.connect();
    },
    connect : function() {
        var host = 'wiseeco.com', port = 8083, clientId = 'clientId-' + WEF.func.randomString(10);
        this.client = new Messaging.Client(host, port, clientId);
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
    onFail : function (message) {
        WEF.wisepush.connected = false;
        WEF.Alert.error("STATE : disconnected.");
        WEF.wisepush.reconnect();
    },
    onConnectionLost : function (responseObject) {
        WEF.wisepush.connected = false;
        if (responseObject.errorCode !== 0) {
            console.log("onConnectionLost:" + responseObject.errorMessage);
        }
        WEF.Alert.error("STATE : disconnected.");
        WEF.wisepush.reconnect()
        //this.client = null;
        //Cleanup messages
        //this.messages = [];
        //WEF.wisepush.renderClearMessages();
        //Cleanup subscriptions
        //this.subscriptions = [];
        //WEF.wisepush.renderClearSubscriptions();
    },
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

        //console.log(messageObj);
        messageObj.id = WEF.wisepush.renderMessage(messageObj);
        WEF.wisepush.messages.push(messageObj);
    },
    onConnect : function () {
        WEF.wisepush.connected = true;
        WEF.Alert.success("STATE : wiseeco.com connection succeeded.");
        if (WEF.wisepush.subscriptions && WEF.wisepush.subscriptions.length > 0) {
            _.each(WEF.wisepush.subscriptions, function(ele, index) {
                WEF.wisepush.subscriptions.splice(index, 1);
                WEF.wisepush.subscribe(ele.topic);
            });
        }
    },
    disconnect : function () {
        this.client.disconnect();
    },
    publish : function (topic, payload, qos, retain) {
        if (!WEF.wisepush.connected) {
            WEF.Alert.error("STATE : disconnected.");
            return false;
        }

        var message = new Messaging.Message(payload);
        message.destinationName = topic;
        message.qos = qos;
        message.retained = retain;
        this.client.send(message);
        WEF.wisepush.renderPublish(topic);
    },
    subscribe : function (topic) {
        if (!WEF.wisepush.connected) {
            WEF.Alert.error("STATE : disconnected.");
            console.log('disconnected.');
            return false;
        }
        if (topic.length < 1) {
            WEF.Alert.error("Topic cannot be empty.");
            console.log('Topic cannot be empty.');
            return false;
        }
        //var alreadyTopic = _.find(this.subscriptions, function(sub) {
        //    return sub.topic == topic;
        //});
        //if (alreadyTopic) {
        //    WEF.Alert.error("You are already subscribed to this topic.");
        //    console.log('You are already subscribed to this topic.' + topic);
        //    return false;
        //}
        this.client.subscribe(topic, {qos: 0});
        var subscription = {'topic': topic, 'qos': 0};
        subscription.id = WEF.wisepush.renderSubscription(subscription);
        this.subscriptions.push(subscription);
        return true;
    },
    unsubscribe : function (id) {
        var subs = _.find(WEF.wisepush.subscriptions, {'id': id});
        this.client.unsubscribe(subs.topic);
        WEF.wisepush.subscriptions = _.filter(WEF.wisepush.subscriptions, function (item) {
            return item.id != id;
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
        WEF.Alert.reset();
        WEF.Alert.success(subscription.topic + " 구독되었습니다.");
        WEF.wisepush.renderClearForm($('form#subForm'));
        WEF.wisepush.renderClearSubscriptions();
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
