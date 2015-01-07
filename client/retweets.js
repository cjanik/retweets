var Retweets = new Mongo.Collection(null),
	twitterStream = new Meteor.Stream('twitterStream');
	
Template.body.events({
	"submit .input-params": function(event){
		
		event.preventDefault();
		
		var input = event.target.track.value;
		console.log('input: ', input);
		
		Meteor.call('stopStream', function(error){
			if(error){
				console.log(error);
			}
		});

		Retweets.remove({});
		//console.log('Retweets', Retweets.find({}).fetch());
		
		Meteor.call('startStream', input, 'en', function(error, result){
			if(error){
				console.log(error);
			} else if(result){
				console.log(result);
			}
		});
		
		event.target.track.value = '';
		
		$('#tweet-view').html('click a bar to see the tweet');
		
		return false;
	}
});

var min = 10000,
	minIndex = 0,
	numBars = 20;
	
function removeMin(numToRemove){
	for(var i = 0; i<numToRemove; i++){
		Retweets.remove({_id: minIndex});
	
		var minDoc = Retweets.findOne({}, {sort: {retweetCount: 1}});

		min = minDoc.retweetCount;
		minIndex = minDoc._id;
	};
	return true;
};

twitterStream.on('tweet', function(id, tweetID, text, rt) {
		
	if(Retweets.find().count() < numBars){
		var isDuplicate = Retweets.findOne({tweetID: tweetID});
		if( isDuplicate){
			Retweets.update({_id: isDuplicate._id}, {$set: {retweetCount: rt}});
		} else {
			Retweets.insert({
				_id: id,
				tweetID: tweetID,
				text: text,
				retweetCount: rt
			});
		}
		
		if( rt < min){
			min = rt;
			minIndex = id;
		}

	} else if(rt > min){
		
		removeMin(1);

		var isDuplicate = Retweets.findOne({tweetID: tweetID});
		
		if(isDuplicate){
			Retweets.update({_id: isDuplicate._id}, {$set: {retweetCount: rt}});
		} else {
			Retweets.insert({
				_id: id,
				tweetID: tweetID,
				text: text,
				retweetCount: rt
			});

		}

	}
	
	console.log(id, tweetID, text, rt);
		//$('#copy, body').append('<h1>'+ dataset[0].text + '</h1>');
});

Template.barChart.rendered = function(){
	//Width and height
	var w = 800;
	var h = 400;
	
	var xScale = d3.scale.ordinal()
					.rangeRoundBands([0, w], 0.05);

	var yScale = d3.scale.linear()
					.range([0, h]);
	
	//Define key function, to be used when binding data
	var key = function(d) {
		return d._id;
	};
	
	function responsivefy(svg) {
    // get container + svg aspect ratio
    var container = d3.select(svg.node().parentNode),
        width = parseInt(svg.style("width")),
        height = parseInt(svg.style("height")),
        aspect = width / height;
        numBars

    // add viewBox and preserveAspectRatio properties,
    // and call resize so that svg resizes on inital page load
    svg.attr("viewBox", "0 0 " + width + " " + height)
        .attr("perserveAspectRatio", "xMinYMid")
        .call(resize);

    // to register multiple listeners for same event type, 
    // you need to add namespace, i.e., 'click.foo'
    // necessary if you call invoke this function for multiple svgs
    // api docs: https://github.com/mbostock/d3/wiki/Selections#on
    d3.select(window).on("resize." + container.attr("id"), resize);

    // get width of container and resize svg to fit it
    function resize() {
        var targetWidth = parseInt(container.style("width"));
        svg.attr("width", targetWidth);
        svg.attr("height", Math.round(targetWidth / aspect));
    }
}
	
	//Create SVG element
	var svg = d3.select("#barChart")
				.attr("width", w)
				.attr("height", (h + 80))
				.call(responsivefy);

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
				return h + 50 - yScale(d.retweetCount);
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
			})
			.on("click", function(d){
				document.getElementById('tweet-view').innerHTML = "";
				twttr.widgets.createTweet(d._id, document.getElementById('tweet-view'),{cards: 'hidden'});
				//d3.select('#tweet-view').html(d.text);
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
				return h + 50 - yScale(d.retweetCount);
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
				return h - yScale(d.retweetCount) - 50;
			})						
		   .attr("font-family", "sans-serif")
		   .attr("font-size", "18px")
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
				return h - yScale(d.retweetCount) + 48;
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

Template.barChart.destroyed = function(){
	Meteor.call('stopStream', function(error){
		if(error){
			console.log(error);
		}
	});
};