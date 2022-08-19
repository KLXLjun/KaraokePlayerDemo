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

	this.ClassicKaraoke = false;
	let x = localStorage.getItem("ClassicKaraoke");
	if(typeof x == "Boolean"){
		this.ClassicKaraoke = x;
	}
	console.log("经典卡拉OK输出:",this.ClassicKaraoke);

	this.list = [];
	
	this.sound = document.getElementById("audioElement");
	this.lrPar;
	
	this.reflist = typeof option.reflist == 'undefined' ? function(){} : option.reflist;
	this.debug = typeof option.debug == 'undefined' ? false : option.debug;
	this.onplaysonginfo = typeof option.onplay == 'undefined' ? function(){} : option.onplay;
	this.onplayend = typeof option.onplayend == 'undefined' ? function(){} : option.onplayend;
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
			this.list = []
			console.log(ajaxRequest.response)
			let dt = ajaxRequest.response;
			this.apiconfig.songlen = dt.length;
			let con = 0;
			dt.forEach(element => {
				let p = element;
				p.id = con;
				this.list.push(element);
				con++
			});
			this.onupdatasonglist(this.list);
		}
		ajaxRequest.send();
	}

	this.setClassicKaraoke = (i) => {
		this.ClassicKaraoke = i;
		localStorage.setItem("ClassicKaraoke",i);
		console.log("经典卡拉OK输出:",this.ClassicKaraoke);
	}

	this.init = () => {
		this.sound.addEventListener("ended",() =>{
			this.playerStatus.playing = false;
			this.playerStatus.paused = true;
			console.log('end');
			this.onplayend();
		});

		this.sound.addEventListener("pause",() =>{
			this.playerStatus.playing = false;
			this.playerStatus.paused = true;
		});

		this.sound.addEventListener("play",() =>{
			this.playerStatus.playing = true;
			this.playerStatus.paused = false;
		});

		this.sound.addEventListener("playing",() =>{
			this.playerStatus.playing = false;
			this.playerStatus.paused = true;
		});

		this.sound.addEventListener("readystatechange", (e)=>{
			console.log(e)
		});
	}
	
	this.play = (index) => {
		if(typeof this.sound != "undefined"){
			if(index == undefined){
				if(this.debug)console.warn(this);
			}else{
				let selectx = null;
				this.list.forEach(element => {
					if(element.id == index){
						selectx = element;
					}
				});
				if(selectx==null){
					console.warn("id不正确",index)
					return
				}
				this.playerStatus.currentIndex = selectx.id;
				this.sound.src = selectx.music;
				this.sound.load();
				this.onplaysonginfo(selectx);

				if(!this.lrPar){
					this.lrPar = new lyricParsingV({
						Audio: this,	//音频标签
						LrcDom: "lrcDomList",
						Debug:false,	//调试模式
						reftime:8,		//画布刷新时间(毫秒)
					});
				}

				this.lrPar.ClassicKaraoke = this.ClassicKaraoke;
				
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
				let playPromise = this.sound.play();
				if(playPromise !== undefined){
					playPromise.then(()=>{
						this.sound.play();
					})
				}
			}
		}
	}

	this.pause = () => {
		if(typeof this.sound != "undefined"){
			this.sound.pause()
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