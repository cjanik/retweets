var Retweets = new Mongo.Collection(null);

twitterStream = new Meteor.Stream('twitterStream');

var retweets = tweetIDs = [];

var min = 10000,
	minIndex = 0;

twitterStream.on('tweet', function(id, rtID, text, rt) {
		
	if(Retweets.find().count() < 50){
		var isDuplicate = Retweets.findOne({rtID: rtID});
		if( isDuplicate){
			Retweets.update({_id: isDuplicate._id}, {$set: {retweetCount: rt}});
		} else {
			Retweets.insert({
				_id: id,
				rtID: rtID,
				text: text,
				retweetCount: rt
			});
		}
		
		if( rt < min){
			min = rt;
			minIndex = id;
		}
		console.log('min first 50:',min);
	} else if(rt > min){
		Retweets.remove({_id: minIndex});
		
		var isDuplicate = Retweets.findOne({rtID: rtID});
		
		if(isDuplicate){
			Retweets.update({_id: isDuplicate._id}, {$set: {retweetCount: rt}});
		} else {
			Retweets.insert({
				_id: id,
				rtID: rtID,
				text: text,
				retweetCount: rt
			});

		}
		
		
		var minDoc = Retweets.findOne({}, {sort: {retweetCount: 1}});
		console.log('mindoc:', minDoc);
		min = minDoc.retweetCount;
		minIndex = minDoc._id;
		console.log('min after 50:',min);
	}
	
	console.log(id, rtID, text, rt);
  });

Template.barChart.rendered = function(){
	//Width and height
	var w = 1000;
	var h = 500;
	
	var xScale = d3.scale.ordinal()
					.rangeRoundBands([0, w], 0.05);

	var yScale = d3.scale.linear()
					.range([0, h]);
	
	//Define key function, to be used when binding data
	var key = function(d) {
		return d._id;
	};
	
	//Create SVG element
	var svg = d3.select("#barChart")
				.attr("width", w)
				.attr("height", (h + 100));

	this.autorun(function(){
		//var modifier = {fields:{value:1}};
		//var sortModifier = Session.get('barChartSortModifier');
		//if(sortModifier && sortModifier.sort)
		//	modifier.sort = sortModifier.sort;
		
		//var dataset = _.pluck(Retweets.find({}, {retweetCount: 1}).fetch(), 'retweetCount');
		var dataset = Retweets.find({}, {retweetCount: 1}).fetch();
		console.log('dataset:',dataset);
		//Update scale domains
		xScale.domain(d3.range(dataset.length));
		yScale.domain([0, d3.max(dataset, function(d) { return d.retweetCount; })]);

		//Select…
		var bars = svg.selectAll("rect")
			.data(dataset, key);
		
		//Enter…
		bars.enter()
			.append("rect")
			.attr("x", w)
			.attr("y", function(d) {
				return h - yScale(d.retweetCount);
			})
			.attr("width", xScale.rangeBand())
			.attr("height", function(d) {
				return yScale(d.retweetCount);
			})
			.attr("fill", function(d) {
				return "rgb(0, 0, " + (d.retweetCount * 10) + ")";
			})
			.attr("data-id", function(d){
				return d._id;
			});

		//Update…
		bars.transition()
			// .delay(function(d, i) {
			// 	return i / dataset.length * 1000;
			// }) // this delay will make transistions sequential instead of paralle
			.duration(500)
			.attr("x", function(d, i) {
				return xScale(i);
			})
			.attr("y", function(d) {
				return h - yScale(d.retweetCount);
			})
			.attr("width", xScale.rangeBand())
			.attr("height", function(d) {
				return yScale(d.retweetCount);
			}).attr("fill", function(d) {
				return "rgb(0, 0, " + (d.retweetCount * 10) + ")";
			});

		//Exit…
		bars.exit()
			.transition()
			.duration(500)
			.attr("x", -xScale.rangeBand())
			.remove();



		//Update all labels

		//Select…
		var labels = svg.selectAll("text")
			.data(dataset, key);
		
		//Enter…
		labels.enter()
			.append("text")
			.text(function(d) {
				return d.retweetCount;
			})
			.attr("text-anchor", "middle")
			.attr("x", w)
			.attr("y", function(d) {
				return h - yScale(d.retweetCount) - 100;
			})						
		   .attr("font-family", "sans-serif")
		   .attr("font-size", "22px")
		   .attr("fill", "#0F0F0F");

		//Update…
		labels.transition()
			// .delay(function(d, i) {
			// 	return i / dataset.length * 1000;
			// }) // this delay will make transistions sequential instead of paralle
			.duration(500)
			.attr("x", function(d, i) {
				return xScale(i) + xScale.rangeBand() / 2;
			}).attr("y", function(d) {
				return h - yScale(d.retweetCount) - 12;
			}).text(function(d) {
				return d.retweetCount;
			});

		//Exit…
		labels.exit()
			.transition()
			.duration(500)
			.attr("x", -xScale.rangeBand())
			.remove();

	});
};