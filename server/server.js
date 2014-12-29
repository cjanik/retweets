
var Retweets = new Mongo.Collection('retweets');

var conf = JSON.parse(Assets.getText('twitter.json'));

var Twit = new TwitMaker({
    consumer_key:         conf.consumer.key,
    consumer_secret:      conf.consumer.secret,
    access_token:         conf.access_token.key,
    access_token_secret:  conf.access_token.secret
});

var stream = Twit.stream('statuses/filter',{track: 'words', language: 'en'});

var twitterStream = new Meteor.Stream('twitterStream');

twitterStream.permissions.write(function(eventName) {
  return false;
});

twitterStream.permissions.read(function(eventName) {
  return true;
});

stream.on('tweet', function(twt){
  if(twt.retweeted_status){
    //console.log(twt);
    twitterStream.emit('tweet', twt.id_str, twt.retweeted_status.id_str, twt.text, twt.retweeted_status.retweet_count);
  }
});

