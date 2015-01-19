
var conf = JSON.parse(Assets.getText('twitter.json'));

var TwitterStreamChannels = Meteor.npmRequire('twitter-stream-channels');

var Twit = new TwitterStreamChannels({
    consumer_key:         conf.consumer.key,
    consumer_secret:      conf.consumer.secret,
    access_token:         conf.access_token.key,
    access_token_secret:  conf.access_token.secret
});

var stream = null,
  twitterStream = new Meteor.Stream('twitterStream');
  
twitterStream.permissions.write(function(eventName) {
  return false;
});

twitterStream.permissions.read(function(eventName) {
  return true;
});

Meteor.methods({
  
  startStream: function(track, lang){
    
    var channels = {
      'terms': ['california', 'hebdo']
    }
  
    stream = Twit.streamChannels({track: channels, language: lang} );
  
    stream.on('channels/terms', function(twt){
      if(twt.retweeted_status){
        //console.log(twt);
        twitterStream.emit('tweet', twt.id_str, twt.retweeted_status.id_str, twt.text, twt.retweeted_status.retweet_count);
      }
    });
  },
  
  stopStream: function() {
    if(stream){
     stream.close();
    }

  }

});

