var now = new moment()
var nowISO= now.toISOString()
var nowISOEncoded = encodeURI(nowISO)

var app = new Vue({
	el: "#app",
	data: {
		url: $cookies.isKey("url")?$cookies.get("url"):"",
		apiKey: "",
		movies: [],
		channels: {},
		useTiles: $cookies.isKey("useTiles")?$cookies.get("useTiles"):false,
		user: {Username: $cookies.isKey("user")?$cookies.get("user"):""},
		authenticated: false,
		HDOnly: $cookies.isKey("HDOnly")?$cookies.get("HDOnly"):"off",//off,on,preferred
		RecordedOnly: false,
		moviesByTime: {},//map of start time to list of movies. Used for Smart filtering
	},
	mounted: function() {
		if ($cookies.isKey("apiKey")) { // there is an access token, use it
			this.authenticated = true
			this.apiKey=$cookies.get("apiKey")
			this.load_data()
		}
	},
	watch: {
		HDOnly: HDOnly=>$cookies.set("HDOnly",HDOnly,"20y"),
		useTiles: useTiles=>$cookies.set("useTiles",useTiles,"20y"),
		url: url=>$cookies.set("url",url,"20y"),
		user: user=>$cookies.set("user",user.Username,"20y")
	},
	methods: {
		logout: function(input){
			$cookies.remove("apiKey")
			this.authenticated = false
		},
		login: function(input){
			axios.post(this.url+"/emby/Users/authenticatebyname",
				this.user,
				{"headers":{"X-Emby-Authorization": "MediaBrowser Client=\"MovieHelper\", Device=\"unsure\", DeviceId=\"unsure\", Version=\"1\")"}}
			).then(function(response){
				this.app.user.Pw = ""//remove from memory
				this.app.apiKey=response.data.AccessToken;
				$cookies.set("apiKey",this.app.apiKey)
				this.app.authenticated=true;
				this.app.load_data()
			})
		},
		load_data: function(){
			//Load the Channel list first
			axios.get(this.url+"/emby/LiveTv/Channels?api_key="+this.apiKey)
				.then(response => {
				response.data.Items.forEach(channel =>
				this.channels[channel.Id] = channel);
				//Load the Programs
				axios.get(this.url+"/emby/LiveTv/Programs?MinStartDate="+nowISOEncoded+"&Limit=10000&IsMovie=true&fields=Width,Overview,ProductionYear,CommunityRating&api_key="+this.apiKey)
					.then(response => {
						movies = response.data.Items
						moviesByTime = {}
						movies.forEach(function(movie){ 
							movie.ShortStartDate = moment(movie.StartDate).calendar()
							movie.detailsActive = false
							movie.IsHD = (movie.Width <= 1280);
							if (!movie.TimerId) movie.TimerId = "none";

							//Dump Movies into time Buckets
							if (moviesByTime[movie.StartDate]==undefined){
								moviesByTime[movie.StartDate] = []
							}
							moviesByTime[movie.StartDate].push(movie)

							//Mark Channel as Used
							this.app.channels[movie.ChannelId].Used = true
						})
						this.moviesByTime = moviesByTime
						this.movies = movies
				})
			}).catch(function (error){
				if (error.response.status==401)
				{
					this.app.authenticated=false
				}
			})
		},
		scheduleRecording: function(movie){
			console.log("Scheduling" + movie.Id)
			axios.get(this.url+"/emby/LiveTv/Timers/Defaults?programId="+movie.Id,{"headers":{"X-Emby-Token":this.apiKey}}).then(function(response){
				axios.post(this.app.url+"/emby/LiveTv/Timers?api_key="+this.app.apiKey,response.data)
				.then(function(postResponse){
					axios.get(this.app.url+"/emby/LiveTv/Programs/"+movie.Id+"?api_key="+this.app.apiKey).then(function(response){
						movie.TimerId = response.data.TimerId
					})
				})
				.catch(function (error) {
					console.log(error);
				});
			})
		},
		cancelRecording: function(movie){
			axios.delete(this.url+"/emby/LiveTv/Timers/"+movie.TimerId+"?api_key="+this.apiKey).then(function(response){
				movie.TimerId="none"
			})
		},
		filterMovies: function(movies){ return movies.filter(function(movie){
				show = true;
				switch (this.app.HDOnly){
					case "off":
						//Don't filter
						break;
					case "on":
						show = show && (movie.IsHD)
						break;
					case "preferred":
						if (movie.IsHD){
							//HD Always OK
						} else {
							possibleDuplicates = moviesByTime[movie.StartDate]
							for (index in possibleDuplicates)
							{
								possibleDuplicate = possibleDuplicates[index];
								if (possibleDuplicate.IsHD && possibleDuplicate.Name == movie.Name)
									show = false;
							}
						}
						break;
				}
				show = show && (movie.TimerId != "none" || !this.app.RecordedOnly )
				return show;
			})
		}
	}
});
