
var conf = JSON.parse(Assets.getText('twitter.json'));

var TwitterStreamChannels = Meteor.npmRequire('twitter-stream-channels');

var Twit = new TwitterStreamChannels({
    consumer_key:         conf.consumer.key,
    consumer_secret:      conf.consumer.secret,
    access_token:         conf.access_token.key,
    access_token_secret:  conf.access_token.secret
});

var stream = null,
  twitterStream = new Meteor.Stream('twitterStream'),
  channels = {},
  lastUpdated = Date.now(),
  rateLimit = false;
  
twitterStream.permissions.write(function(eventName) {
  return false;
});

twitterStream.permissions.read(function(eventName) {
  return true;
});

twitterStream.on('client', function(track){

  var self = this;

  addToTrack(self.subscriptionId, track);

  stream.on('channels/'+self.subscriptionId, function(twt){
      if(twt.retweeted_status){
        //console.log(twt);
        twitterStream.emit(self.subscriptionId, twt.id_str, twt.retweeted_status.id_str, twt.text, twt.retweeted_status.retweet_count);
      }
    });

});

function addToTrack(subscriber, track){
  channels[subscriber] = track;
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
  }

}

Meteor.methods({
  
  startStream: function(){
  
    stream = Twit.streamChannels({track: channels, language: lang} );
  
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
  },
  
  stopStream: function() {
    if(stream){
     stream.close();
    }

  }

});

