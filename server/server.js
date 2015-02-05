
var conf = JSON.parse(Assets.getText('twitter.json'));

var TwitterStreamChannels = Meteor.npmRequire('twitter-stream-channels');

var Twit = new TwitterStreamChannels({
    consumer_key:         conf.consumer.key,
    consumer_secret:      conf.consumer.secret,
    access_token:         conf.access_token.key,
    access_token_secret:  conf.access_token.secret
});

var twitterStream = new Meteor.Stream('twitterStream'),
  channels = {
    'meteor': ['meteor']
  },
  lastUpdated = Date.now(),
  rateLimit = false,
  lang = 'en';

var stream = Twit.streamChannels( {track: channels, language: lang} );
  
twitterStream.permissions.write(function(eventName) {
  //console.log('write eventName: ', eventName);
  return eventName === 'subscribeClient' || eventName === 'unsubscribe';
});

twitterStream.permissions.read(function(eventName) {
  //console.log('read eventName: ', eventName, ' this.subscriptionId: ', this.subscriptionId);
  return this.subscriptionId === eventName || eventName.indexOf('subscribed') > -1;
});

twitterStream.on('unsubscribe', function(){
  //console.log('unsubscribe: ', this.subscriptionId);
  var self = this;
  delete channels[self.subscriptionId];
});

twitterStream.on('subscribeClient', function(track, language, tempId){

  //console.log('subscribeClient: ', this.subscriptionId);

  var subId = this.subscriptionId.toString();

  twitterStream.emit('subscribed' + tempId, subId);

  lang = language;

  addToTrack(subId, track);

  stream.on('channels/' + subId, function(twt){
    if(twt.retweeted_status){
      console.log(twt);
      twitterStream.emit(subId, twt.id_str, twt.retweeted_status.id_str, twt.text, twt.retweeted_status.retweet_count);
    }
  });

});


function addToTrack(subscriber, track){
  channels[subscriber] = track;
  console.log('channels: ', channels);
  updateTwit();
}

function updateTwit(){
  var now = Date.now(),
    updated = false;

  if(now - lastUpdated > 5 && rateLimit === false){
    Meteor.call('startStream');
    lastUpdated = now;
    updated = true;
  } else if(rateLimit === true && now - lastUpdated > 60){
    Meteor.call('startStream');
    lastUpdated = now;
    rateLimit = false;
    updated = true;
  }

  if(!updated){
    Meteor.setTimeout(updateTwit, 5);
  } else{
    return true;
  }

}

Meteor.methods({
  
 /* startStream: function(){
  
    
  
    stream.on('channels/', function(twt){
      if(twt.retweeted_status){
        //console.log(twt);
        twitterStream.emit('tweet', twt.id_str, twt.retweeted_status.id_str, twt.text, twt.retweeted_status.retweet_count);
      }
    });

    stream.on('error', function(data){
      if(data.statusCode > 200){
        rateLimit = true;
      }
    });

    stream.on('disconnect', function(data){
      twitterStream.emit('disconnected', data);
    });
  },
  */
  stopStream: function() {
    if(stream){
     stream.close();
    }

  }

});

