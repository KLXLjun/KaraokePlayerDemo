var Player = function(option){
	this.listmodel = {
		title:"unknow",
		artist:"unknow",
		album:"unknow"
	}
	
	this.playerStatus = {
		rate: 1,
		volume: 1,
		playing:false,
		paused:true,
		currentIndex:0,
		muted:false,
		loop:false
	}
	
	addEventListener("resize", function(e) {
		let cv = document.getElementById('canvasx');
		console.log(cv)
		cv.width = window.innerWidth;
		cv.height = window.innerWidth;
	});
	
	this.listArr = {
		songinfo:   [], //use listmodel
		songsrc:    []  ,//string
		songlrcsrc: []
	}
	
	this.nowline = -1;
	
	let thiss = this;
	
	this.sound;
	
	this.lrPar;
	
	this.reflist = typeof option.reflist == 'undefined' ? function(){} : option.reflist;
	this.onplaysonginfo = typeof option.onplay == 'undefined' ? function(){} : option.onplay;
	this.api = typeof option.api == 'undefined' ? "" : option.api;
	this.apiconfig = {
		nowloadpage: 0,
		songlen: 0,
		limit: 0
	}
}

Player.prototype = {
	initlist: function(){
		this.getnextpage()
	},
	getnextpage: function(){
		let pgs = this.apiconfig.nowloadpage
		if(pgs < this.apiconfig.songlen / this.apiconfig.limit || this.apiconfig.songlen == 0){
			let lthis = this;
			let ajaxRequest = new XMLHttpRequest();
			ajaxRequest.open('GET', this.api + '?page=' + this.apiconfig.nowloadpage + (this.apiconfig.limit != 0 ? "&limit=" + this.apiconfig.limit : ""), true);
			ajaxRequest.responseType = 'json';
			ajaxRequest.onload = function() {
				console.log(ajaxRequest.response)
				let dt = ajaxRequest.response;
				if(lthis.apiconfig.limit != dt.limit){
					lthis.apiconfig.limit = dt.limit;
				}
				lthis.apiconfig.songlen = dt.length;
				dt.result.forEach(element => {
					lthis.listArr.songinfo.push({
						"title":element.title,
						"artist":element.artist,
						"album":element.album
					});
					lthis.listArr.songsrc.push(element.music)
					lthis.listArr.songlrcsrc.push(element.lrc)
				});
				lthis.onupdatasonglist(lthis.listArr.songinfo)
				console.log(this,lthis)
			}
			ajaxRequest.send();
			this.apiconfig.nowloadpage = this.apiconfig.nowloadpage + 1
		}
	},
	init: function(index){
		let thiss = this;
		console.log(thiss)
		thiss.stop()
		thiss.playerStatus.currentIndex = index;
		this.sound = new Howl({
			src: this.listArr.songsrc[thiss.playerStatus.currentIndex],
			autoplay: false,
			loop: thiss.playerStatus.loop,
			volume: thiss.playerStatus.volume,
			html5: true,
			preload:true,
			rate: thiss.rate,
			mute: thiss.playerStatus.muted,
			onload() {
				console.log('onload!',this);
			},
			onplay() {
				thiss.playerStatus.playing = true;
				thiss.playerStatus.paused = false;
				//that.duration = that.formatTime(Math.round(this._duration));
				console.log('onplay!',this);
			},
			onmute() {
				thiss.playerStatus.muted = this._muted;
			},
			onpause() {
				thiss.playerStatus.playing = false;
				thiss.playerStatus.paused = true;
			},
			onstop() {
				thiss.playerStatus.playing = false;
				thiss.playerStatus.paused = true;
			},
			onend() {
				thiss.playerStatus.playing = false;
				thiss.playerStatus.paused = true;
				console.log('end');
				thiss.next();
			},
		});
		thiss.onplaysonginfo(thiss.listArr.songinfo[thiss.playerStatus.currentIndex])
		if(typeof this.lrPar != 'undefined'){
			thiss.lrPar.clear();
			thiss.lrPar = null;
		}
		
		thiss.lrPar = new lyricParsing({
		    //音频标签
		    audio:thiss,
		    //画布标签                  
		    canvas:document.getElementById('canvasx'),
		    //歌词全局偏移值
		    offset:60,
		    //调试模式
		    debug:true,
		    //画布刷新时间(毫秒)
		    reftime:32,
		    //渲染字体
			rander_font:"32px Microsoft YaHei",
			canvasListId:document.getElementById('canvaslist')
		});
		
		let ajaxRequest = new XMLHttpRequest();
		ajaxRequest.open('GET', this.listArr.songlrcsrc[thiss.playerStatus.currentIndex], true);
		ajaxRequest.responseType = 'text';
		ajaxRequest.onload = function() {
			thiss.lrPar.init(ajaxRequest.response)
		}
		ajaxRequest.send();
	},
	play: function(index){
		if(typeof this.sound != "undefined"){
			console.log(this)
			this.sound.play()
		}
	},
	pause: function(){
		if(typeof this.sound != "undefined"){
			this.sound.pause()
		}	
	},
	stop(){
		if(typeof this.sound != "undefined"){
			this.sound.stop()
		}
	},
	next(){
		if((this.apiconfig.songlen > this.playerStatus.currentIndex + 1)){
			this.playerStatus.currentIndex = this.playerStatus.currentIndex + 1
			this.init(this.playerStatus.currentIndex);
			this.play();
		}
	},
	duration: function(){
		if(typeof this.sound != "undefined"){
			return this.sound.duration();
		}else{
			return 0;
		}
	},
	seek: function(v){
		if(typeof this.sound != "undefined"){
			if(typeof v != "undefined"){
				this.sound.seek(v);
			}else{
				return this.sound.seek();
			}
		}else{
			return 0;
		}
	},
	playPercentage: function(){
		if(typeof this.sound != "undefined"){
			let d = this.sound.duration();
			let s = this.sound.seek();
			return s / d;
		}else{
			return 0;
		}
	},
	volume: function(v){
		if(typeof this.sound != "undefined"){
			let t = v / 100;
			this.playerStatus.volume = t;
			this.sound.volume(t);
		}
	},
	loop: function(){
		if(typeof this.sound != "undefined"){
			this.playerStatus.loop = !this.playerStatus.loop;
		}
	},
	mute: function(){
		if(typeof this.sound != "undefined"){
			this.playerStatus.muted = !this.playerStatus.muted;
			this.sound.mute()
		}
	}
}
/*
Player.prototype = {
	play: function(index){
		if(typeof index == 'undefined'){
			if(typeof this.sound != "undefined"){
				console.log(this.sound.state())
				this.sound.play()
			}
		}else{
			if(typeof this.sound != "undefined"){
				this.sound.stop()
			}
			let tmp = this.listArr[index]
			this.onplay({
				title:tmp.title,
				artist:tmp.artist
			})
			this.sound = new Howl({
				src: tmp.url,
				html5: true,
				onplay: function() {
					//播放
					console.log(this)
				},
				onload: function() {
					//加载
				},
				onend: function() {
					//停止
				},
				onpause: function() {
					//暂停
				},
				onstop: function() {
					//停止
				},
				onseek: function(e) {
					//重新定位
					console.log(e)
				}
			});
			this.sound.play()
		}
	},
	
	paused: function(){
		return this.sound.paused
	},
	
	pause: function(){
		if(typeof this.sound != "undefined"){
			this.sound.pause()
		}
	},
	
	add: function(inputv){
		let self = this;
		
		let title = typeof inputv.title == 'undefined' ? 'unknow title' : inputv.title;
		let artist = typeof inputv.artist == 'undefined' ? 'unknow artist' : inputv.artist;
		let album = typeof inputv.album == 'undefined' ? 'unknow album' : inputv.album;
		let url = typeof inputv.url == 'undefined' ? '/' : inputv.url;
		
		self.listArr.unshift({
			title:title,
			artist:artist,
			album:album,
			url:url
		});
		
		this.reflist(artist + ' - ' + title);
	},
	
	addlist: function(inputv){
		
	},
	
	volume: function(v){
		if(typeof this.sound != "undefined"){
			let t = v / 100;
			this.sound.volume(t);
		}
	},
	
	duration: function(){
		if(typeof this.sound != "undefined"){
			return this.sound.duration();
		}else{
			return 0;
		}
	},
	
	seek: function(v){
		if(typeof this.sound != "undefined"){
			if(typeof v != "undefined"){
				this.sound.seek(v);
			}else{
				return this.sound.seek();
			}
		}else{
			return 0;
		}
	},
	
	playPercentage: function(){
		if(typeof this.sound != "undefined"){
			let d = this.sound.duration();
			let s = this.sound.seek();
			return s / d;
		}else{
			return 0;
		}
	},
	
	loop: function(){
		if(typeof this.sound != "undefined"){
			this.sound.loop() = !this.sound.loop();
		}
	}
}
*/