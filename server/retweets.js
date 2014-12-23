
var conf = JSON.parse(Assets.getText('twitter.json'));

var Twit = new TwitMaker({
    consumer_key:         conf.consumer.key,
    consumer_secret:      conf.consumer.secret,
    access_token:         conf.access_token.key,
    access_token_secret:  conf.access_token.secret
});

var stream = Twit.stream('statuses/sample');

stream.on('tweet', function(tweet){
  console.log(tweet);
});