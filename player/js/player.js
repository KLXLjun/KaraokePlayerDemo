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
	if(localStorage.getItem("ClassicKaraoke") == "true"){
		this.ClassicKaraoke = true;
	}
	console.log("经典卡拉OK输出:",this.ClassicKaraoke);

	this.AudioAnalyser = false;
	if(localStorage.getItem("AudioAnalyser") == "true"){
		this.AudioAnalyser = true;
	}
	console.log("频谱显示:",this.AudioAnalyser);

	this.LastCount = Number(localStorage.getItem("LastCount"));
	if(!this.LastCount){
		this.LastCount = 6;
	}
	console.log("倒计时显示时间:",this.LastCount);

	this.LastTimePer = localStorage.getItem("LastTimePer");
	if(!this.LastTimePer){
		this.LastTimePer = 1;
	}
	console.log("倒计时时间精度:",this.LastTimePer);

	this.list = [];

	this.aContext = null;
	this.aSource = null;
	this.aAnalyser = null;
	this.analyserOutput = [];
	this.bassBiquadFilter = null;
	this.highBiquadFilter = null;
	this.masterGain = null;
	this.convolver = null;
	this.convolverGain = null;

	this.convolverStatus = false;
	
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

	this.height = 0;
	this.width = 0;

	this.SPECTROGRAM_COUNT = 32;
	this.f_b = [];			//波峰位置数组
	this.down_b = [];		//波峰下落时间
	this.down_b_speed = [];	//波峰下落速度 Math.pow(10,0.5)
	this.down_b_speed2 = [];	//下落峰值计数

	for(let i=0;i<this.SPECTROGRAM_COUNT;i++){
		this.f_b[i] = 0;
		this.down_b[i] = 20;
		this.down_b_speed[i] = 1;
		this.down_b_speed2[i] = 1;
	}

	this.cvs = null;

	this.loc = new Array(this.SPECTROGRAM_COUNT);

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

	this.setAudioAnalyser = (i) => {
		this.AudioAnalyser = i;
		localStorage.setItem("AudioAnalyser",i);
		console.log("频谱显示:",this.AudioAnalyser);
	}
	
	this.setLastTime = (i) => {
		this.LastCount = i;
		localStorage.setItem("LastCount",i);
		if(this.lrPar){
			this.lrPar.LastTime = Number(i);
		}
	}

	this.setLastTimePer = (i) => {
		this.LastTimePer = i;
		localStorage.setItem("LastTimePer",i);
		if(this.lrPar){
			this.lrPar.LastTimePer = i;
		}
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

	function dks(vle){
		let s = vle.toString()
		let t = s.indexOf('.')
		if(t != -1){
			return s.substr(0,t)
		}else{
			return vle
		}
	}
	
	this.play = (index) => {
		if(typeof this.sound != "undefined"){
			if(index == undefined){
				if(this.debug)console.warn(this);
				this.sound.play();
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
				if(this.aContext==null){
					this.aContext = new(window.AudioContext || window.webkitAudioContext)();
					this.aSource = this.aContext.createMediaElementSource(this.sound);
					this.aAnalyser = this.aContext.createAnalyser();
					this.aSource.connect(this.aAnalyser);
					this.aAnalyser.connect(this.aContext.destination);

					this.aAnalyser.size = 4096;
					this.aAnalyser.smoothingTimeConstant = 0.65;

					this.analyserOutput = new Uint8Array(this.aAnalyser.frequencyBinCount);

					let sampleratePoint = new Array(this.SPECTROGRAM_COUNT);
					for (let i = 0; i < this.loc.length; i++) {
						//20000表示的最大频点20KHZ,这里的20-20K之间坐标的数据成对数关系,这是音频标准
						let F = Math.pow((this.aContext.sampleRate) / 2 / this.SPECTROGRAM_COUNT, 1.0 / this.SPECTROGRAM_COUNT);//方法中20为低频起点20HZ，31为段数
						sampleratePoint[i] = this.SPECTROGRAM_COUNT * Math.pow(F, i);//乘方，30为低频起点
						//这里的samplerate为采样率(samplerate / (1024 * 8))是8分频后点FFT的点密度
						this.loc[i] = sampleratePoint[i] / (this.aContext.sampleRate / (this.aAnalyser.frequencyBinCount * 2));//估算出每一个频点的位置
					}
					for(let i=0;i<this.loc.length;i++){
						this.loc[i] = parseInt(dks(this.loc[i]))
					}
					for(let i=0;i< 10;i++){
						this.loc[i] = i;
					}
					console.log(this.loc);

					//低通
					this.bassBiquadFilter = this.aContext.createBiquadFilter();
					this.aSource.connect(this.bassBiquadFilter);
					this.bassBiquadFilter.Q = 1;
					this.bassBiquadFilter.type = 'lowpass';// 低通
					this.bassBiquadFilter.frequency.value = 400;// 让400HZ以下的声音通过
					//this.bassBiquadFilter.connect(this.aContext.destination);

					//高通
					this.highBiquadFilter = this.aContext.createBiquadFilter();
					this.aSource.connect(this.highBiquadFilter);
					this.highBiquadFilter.Q = 1;
					this.highBiquadFilter.type = 'highpass';// 高通
					this.highBiquadFilter.frequency.value = 400;// 让400HZ以上的声音通过
					
					//混响限制器
					this.masterGain = this.aContext.createGain();
					this.highBiquadFilter.connect(this.masterGain);
					this.masterGain.gain.value = 1;
					//this.masterGain.connect(this.aContext.destination);

					//混响
					this.convolver = this.aContext.createConvolver();
					this.highBiquadFilter.connect(this.convolver);
					let frameCount = this.aContext.sampleRate / 2;
					let buffer = this.aContext.createBuffer(2,frameCount,this.aContext.sampleRate);
					let data = [buffer.getChannelData(0),buffer.getChannelData(1)];
					for(let i = 0;i < this.aContext.sampleRate;i++){
						//平方根衰减
						let v=1-Math.sqrt(i / this.aContext.sampleRate);
						//叠加24个不同频率
						for(let j = 1;j <= 24;j++){
							v*=Math.sin(i/j);
						}
						data[0][i] = data[1][i] = v;
					};
					this.convolver.buffer=buffer;

					//混响限制器
					this.convolverGain = this.aContext.createGain();
					this.convolver.connect(this.convolverGain);
					this.convolverGain.gain.value = 0;
					//this.convolverGain.connect(this.aContext.destination);
				}

				if(this.cvs==null){
					this.cvs = document.getElementById("cvs").getContext("2d");
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
						RefEvent:this.lrcref,
					});
				}

				this.lrPar.ClassicKaraoke = this.ClassicKaraoke;
				this.lrPar.LastTime = this.LastCount;
				this.lrPar.LastTimePer = this.LastTimePer;
				
				
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

	this.lrcref = () => {
		if(this.aAnalyser!=null){
			if(!this.AudioAnalyser){
				return
			}
			this.cvs.strokeStyle = "#cccccc";
			this.aAnalyser.getByteFrequencyData(this.analyserOutput);

			let o = ((this.width / this.SPECTROGRAM_COUNT) * 0.1);
			let barWidth = (this.width / this.SPECTROGRAM_COUNT) - o;

			//清除画布
			this.cvs.clearRect(0, 0, this.width, this.height);

			let x = 0;
			for (let i = 0; i < this.SPECTROGRAM_COUNT; i++) {
				x = x + o;
				let b = i;
				let barHeight = this.height * (1 - (this.analyserOutput[this.loc[b]] / 256));
				let bbarHeight = this.height * (1 - (this.f_b[b] / 256));
				
				if(this.analyserOutput[this.loc[b]] > this.f_b[b]){
					//当柱大于顶峰0
					this.f_b[b] = this.analyserOutput[this.loc[b]];
					this.down_b[b] = 8;
					this.down_b_speed[b] = 1;
					this.down_b_speed2[b] = 1;
				}else{
					//当柱小于顶峰
					if(this.f_b[b] > 0){
						this.down_b_speed[b] = this.down_b_speed[b] + 0.01;
						this.down_b_speed2[b] = Math.pow(this.down_b_speed[b],0.5);
						this.f_b[b] = this.f_b[b] - this.down_b_speed2[b];
					}
				}
				
				let hx = this.height - (this.height - (this.height - barHeight)); 
				//绘制柱
				this.cvs.fillStyle="#FF0000";
				this.cvs.fillRect(x,this.height,barWidth,hx - hx - hx);
				
				let ohe = (this.height - (this.height - bbarHeight));
				//绘制顶峰
				this.cvs.fillStyle="#595959";
				this.cvs.fillRect(x,ohe,barWidth,1);
				x = x + barWidth;
			}
		}
	}

	this.changeConvolverStatus = () => {
		if(typeof this.aContext != "undefined"){
			this.convolverStatus = !this.convolverStatus
			if(this.convolverStatus){
				this.masterGain.gain.value = 0.9;
				this.convolverGain.gain.value = 2;
				this.aAnalyser.disconnect();
				this.convolverGain.connect(this.aContext.destination);
				this.masterGain.connect(this.aContext.destination);
				this.bassBiquadFilter.connect(this.aContext.destination);
			}else{
				this.masterGain.gain.value = 1;
				this.convolverGain.gain.value = 0;
				this.aAnalyser.connect(this.aContext.destination);
				this.convolverGain.disconnect();
				this.masterGain.disconnect();
				this.bassBiquadFilter.disconnect();
			}
			console.log(this.convolverStatus);
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