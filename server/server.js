
var conf = JSON.parse(Assets.getText('twitter.json'));

var TwitterStreamChannels = Meteor.npmRequire('twitter-stream-channels');

var Twit = new TwitterStreamChannels({
    consumer_key:         conf.consumer.key,
    consumer_secret:      conf.consumer.secret,
    access_token:         conf.access_token.key,
    access_token_secret:  conf.access_token.secret
});

var serverStream = new Meteor.Stream('clientStream'),
  channels = {},
  lastUpdated = Date.now(),
  rateLimit = false,
  lang = 'en';
  
serverStream.permissions.write(function(eventName) {

  return eventName === 'subscribeClient' || eventName === 'unsubscribe';
});

serverStream.permissions.read(function(eventName) {

  return this.subscriptionId === eventName || eventName.indexOf('subscribed') > -1 || eventName === 'error';
});


serverStream.on('unsubscribe', function(client){
  var self = this;
  if(client === self.subscriptionId){
    console.log('clientCheck: ', client);
    stream.removeListener('channels/' + client, setListener);
    delete channels[self.subscriptionId];
  }
});

serverStream.on('subscribeClient', function(track, language, tempId){

  //console.log('subscribeClient: ', this.subscriptionId);

  var subId = this.subscriptionId.toString();

  serverStream.emit('subscribed' + tempId, subId);

  lang = language;

  addToTrack(subId, track);

  stream.on('channels/' + subId, function(twt){
    setListener( twt, subId, track);
    }
  );

  stream.on('error', function(error){
    serverStream.emit('error', error);
    console.log('error: ', error);
  });

});

function setListener(twt, client, track){
    if(twt.retweeted_status){
      serverStream.emit(client, track, twt.id_str, twt.retweeted_status.id_str, twt.text, twt.retweeted_status.retweet_count);
    }
}

function addToTrack(subscriber, track){
  channels[subscriber] = Array(track);
  console.log('channels: ', channels);
  updateTwit();
}

function updateTwit(){
  var now = Date.now(),
    updated = false;
  console.log('now: ', now, ' lastUpdated: ', lastUpdated);

  if(now - lastUpdated > 5000 && rateLimit === false){

    stream = Twit.streamChannels( {track: channels, language: lang} );
    console.log('updated, no rateLimit: ', now - lastUpdated);
    lastUpdated = now;
    updated = true;
  } else if(rateLimit === true && now - lastUpdated > 60000){

    stream = Twit.streamChannels( {track: channels, language: lang} );
    console.log('updated, after rateLimit', now - lastUpdated);
    lastUpdated = now;
    rateLimit = false;
    updated = true;
  }

  if(!updated){
    Meteor.setTimeout(updateTwit, 1000);
  } else{
    return true;
  }

}


