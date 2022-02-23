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
		currentIndexHash:"",
		currentIndex:0,
		muted:false,
		loop:false
	}

	this.listmap = new Map();
	this.listhash = [];
	
	this.sound = document.getElementById("audioElement");
	this.lrPar;
	
	this.reflist = typeof option.reflist == 'undefined' ? function(){} : option.reflist;
	this.debug = typeof option.debug == 'undefined' ? false : option.debug;
	this.onplaysonginfo = typeof option.onplay == 'undefined' ? function(){} : option.onplay;
	this.api = typeof option.api == 'undefined' ? "" : option.api;
	this.apiconfig = {
		nowloadpage: 0,
		songlen: 0,
		limit: 0
	}

	this.initlist = () => {
		let ajaxRequest = new XMLHttpRequest();
		ajaxRequest.open('GET', this.api, true);
		ajaxRequest.responseType = 'json';
		ajaxRequest.onload = () => {
			console.log(ajaxRequest.response)
			let dt = ajaxRequest.response;
			this.apiconfig.songlen = dt.length;
			dt.forEach(element => {
				this.listmap.set(element.hash,element.info);
				this.listhash.push(element.hash);
			});
			this.onupdatasonglist(this.listmap);
		}
		ajaxRequest.send();
	}

	this.init = () => {
		this.sound.addEventListener("ended",() =>{
			this.playerStatus.playing = false;
			this.playerStatus.paused = true;
			console.log('end');
			this.next();
		});

		this.sound.addEventListener("pause",() =>{
			this.playerStatus.playing = false;
			this.playerStatus.paused = true;
		});

		this.sound.addEventListener("play",() =>{
			this.playerStatus.playing = true;
			this.playerStatus.paused = false;
			console.log('onplay!');
		});

		this.sound.addEventListener("playing",() =>{
			this.playerStatus.playing = false;
			this.playerStatus.paused = true;
		});
	}
	
	this.play = (index) => {
		if(typeof this.sound != "undefined"){
			if(index == undefined){
				if(this.debug)console.log(this);
				this.sound.play();
			}else{
				this.pause();
				let hash = this.listhash[index];
				let selectx = this.listmap.get(hash);
				if(selectx == undefined){
					return
				}
				this.playerStatus.currentIndexHash = hash;
				this.playerStatus.currentIndex = index;
				this.sound.src = selectx.music;
				this.onplaysonginfo(selectx)

				if(!this.lrPar){
					this.lrPar = new lyricParsingV({
						Audio: this,	//音频标签
						LrcDom: "lrcDomList",
						debug:false,	//调试模式
						reftime:32,		//画布刷新时间(毫秒)
					});
				}
				
				let ajaxRequest = new XMLHttpRequest();
				ajaxRequest.open('GET', selectx.lrc, true);
				ajaxRequest.responseType = 'text';
				ajaxRequest.onreadystatechange = () => {
					if (ajaxRequest.readyState == 4) {
						if (ajaxRequest.status == 200) {
							this.lrPar.ReadLrc(ajaxRequest.response)
						}else{
							this.lrPar.ReadLrc("[00:00.00]Not Found Lrc File")
						}
					}
				}
				ajaxRequest.send();
				this.sound.play();
			}
		}
	}

	this.pause = () => {
		if(typeof this.sound != "undefined"){
			this.sound.pause()
		}
	}

	this.next = () => {
		if((this.apiconfig.songlen > this.playerStatus.currentIndex + 1)){
			this.playerStatus.currentIndex = this.playerStatus.currentIndex + 1
			this.play(this.playerStatus.currentIndex);
		}
	}

	this.duration = () => {
		if(typeof this.sound != "undefined"){
			return this.sound.duration;
		}else{
			return 0;
		}
	}

	this.seek = (v) => {
		if(typeof this.sound != "undefined"){
			if(typeof v != "undefined"){
				this.sound.currentTime = v;
			}else{
				return this.sound.currentTime;
			}
		}else{
			return 0;
		}
	}

	this.playPercentage = () => {
		if(typeof this.sound != "undefined"){
			let d = this.sound.duration;
			let s = this.sound.currentTime;
			return s / d;
		}else{
			return 0;
		}
	}

	this.volume = (v) => {
		if(typeof this.sound != "undefined"){
			let t = v / 100;
			this.playerStatus.volume = t;
			this.sound.volume = t;
		}
	}

	this.loop = () => {
		if(typeof this.sound != "undefined"){
			this.playerStatus.loop = !this.playerStatus.loop;
			this.sound.loop = this.playerStatus.loop;
		}
	}

	this.mute = () => {
		if(typeof this.sound != "undefined"){
			this.playerStatus.muted = !this.playerStatus.muted;
			this.sound.muted = this.playerStatus.muted;
		}
	}
}