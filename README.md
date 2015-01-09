retweets
========

Display a visualization of trending tweets in real time.

server connects to public twitter stream, sending those tweets that have been retweeted and match criteria, to the client.

client builds a collection of the most popular tweets in real time, updating the count as the same tweet is retweeted, and purging the low counts as more popular items are retweeted.

d3 builds a bar chart on the reactive collection.

see a demo at [retweets.meteor.com](http://retweets.meteor.com)
