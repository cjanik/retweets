
var Retweets = new Mongo.Collection('retweets');

var conf = JSON.parse(Assets.getText('twitter.json'));

var Twit = new TwitMaker({
    consumer_key:         conf.consumer.key,
    consumer_secret:      conf.consumer.secret,
    access_token:         conf.access_token.key,
    access_token_secret:  conf.access_token.secret
});

Meteor.methods({
  twitterStream: function(options){
    var streamAsync = Meteor.wrapAsync(Twit.stream, Twit);
    var result = streamAsync(options);
    return result;
  }
});

var stream = Meteor.call( 'twitterStream', 'statuses/sample');

  
  stream.on('tweet', function(twt){
  
  var min = 1,
    max;
  
  if(twt.retweeted_status && twt.retweeted_status.retweet_count > min){
    
  //  if( Retweets.findOne({_id: twt.id_str}) ) {
  //    Retweets.update({_id: twt.id_str},{text: twt.text, retweetCount: twt.retweeted_status.retweet_count});
  //  } else {
      Retweets.insert({
        _id: twt.id_str,
        text: twt.text,
        retweetCount: twt.retweeted_status.retweet_count
      });
  //  }
    
    
    console.log('tweet:', twt['text'], 'retweets:', twt.retweeted_status.retweet_count);
  }
});