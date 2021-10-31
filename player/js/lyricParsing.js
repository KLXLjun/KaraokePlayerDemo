function lyricParsing(option){
	this.ver = "0.0.1"
	this.audio = typeof option.audio!="undefined" ? option.audio : undefined;
	this.canvas = typeof option.canvas!="undefined" ? option.canvas : undefined;
	this.audiourl = typeof option.audiourl!="undefined" ? option.audiourl : undefined;
	this.lrc = typeof option.lrc!="undefined" ? option.lrc : undefined;
	this.debug = typeof option.debug!="undefined" && typeof option.debug=="boolean" ? option.debug : false;
	this.Global_lrc_offset = typeof option.offset!="undefined" && typeof option.offset=="number" ? option.offset : 0;
	this.rander_font = typeof option.rander_font!="undefined" && typeof option.rander_font=="string" ? option.rander_font : "32px Microsoft YaHei";
	this.oLRC = {
	    ti: "", //歌曲名
	    ar: "", //演唱者
	    al: "", //专辑名
	    by: "", //歌词制作人
	    offset: 0, //时间补偿值，单位毫秒，用于调整歌词整体位置
	    ms: [] ,//歌词数组{t:时间,c:歌词}
	};
	this.Refresh_interval = typeof option.reftime != "undefined" ? option.reftime : 16;
	
	this.canvasCount = 5;
	this.canvasListId = typeof option.canvasListId !="undefined" ? option.canvasListId : undefined;
	this.canvasList = [];
	this.testcanvas = 'Huyaoi957363E8FADFFC1585D432FEEE87C3AC';
	
	///歌词部分
	this.lrc_top = 0;
	this.lrc_offset = 0;
	
	this.timer = setInterval(() => {
		this.ref_lrc();
	}, this.Refresh_interval);
	
	//倒计时
	this.countdown = {
		arr: [],
		stat: false,
		max: 5,
		now: 5,
		apps: ""
	}
	
	//初始化
	this.init = function(lrc){
		let t = document.querySelector('#' + this.testcanvas);
		if(t == null){
			let x = document.createElement('canvas');
			x.id = this.testcanvas;
			//x.style.display = 'none';
			document.querySelector('body').appendChild(x)
		}
		let d = this.canvasListId.querySelectorAll('canvas');
		if(d.length < 1){
			for (let i = 0;i < this.canvasCount; i++) {
				let o = document.createElement('canvas');
				o.width = window.innerWidth;
				o.height = 42;
				o.style.margin = '6px 0';
				this.canvasListId.appendChild(o)
			}
		}
		this.canvasList = this.canvasListId.querySelectorAll('canvas');
		console.log(d,this)
		if(lrc){
			this.lrc = lrc
			this.read_lrc();
		}
		//this.audio.setAttribute("src",this.audiourl)
	}
	
	addEventListener("resize", () => {
		console.log(this)
		if(typeof this.canvasList != 'undefined'){
			console.log(this.canvasList)
			for (let s of this.canvasList) {
				s.width = window.innerWidth;
			}
		}
	});

	this.clear = function(){
		clearInterval(this.timer)
	}
	
	this.nowperc = 0;
	this.nowline = 0;
	this.maxline = 0;
	
	//歌词时间转换
	function lrc_time_sa(timea) {
		let time_expression = /([0-9]+):([0-9]+)\.([0-9]+)/i,seconds = timea.replace(time_expression, function(a, b, c, d) {return Number(b * 60) + Number(c) + parseFloat('0.' + d)});
		return seconds;
	}
	
	//读取歌词
	this.read_lrc = function(){
		//console.group('歌词读取日志');
		this.oLRC = {
			ti: "", //歌曲名
			ar: "", //演唱者
			al: "", //专辑名
			by: "", //歌词制作人
			olrc: true,//是否是单行歌词
			offset: 0, //时间补偿值，单位毫秒，用于调整歌词整体位置
			ms: [] //歌词数组{t:时间,c:歌词}
		};
		let lrc = this.lrc
		
		//判断是否是0
		if(lrc.length==0) return;
		let lrcs = lrc.split('\n');//用回车拆分成数组
		//if(this.debug)console.log(lrcs);
		
		//测试是单行歌词还是渐进式歌词
		for(let i=0;i<lrcs.length;i++){
			let t1 = lrcs[i].indexOf('[');
			//console.log(lrcs[i]);
			if(t1 == -1){
				continue;
			}else{
				let t2 = lrcs[i].indexOf(']',t1);
				//console.log(t1,t2)
				if(t2 == -1){
					continue;
				}else{
					let t4 = lrcs[i].substring(t1 + 1,t2);
					let t5 = t4.split(':');
					//console.log(t4,t5)
					if(!isNaN(parseInt(t5[0]))) {
						let t3 = lrcs[i].indexOf('[',t2);
						//console.log(t3)
						if(t3 == -1){
							this.oLRC.olrc = true;
						}else{
							if(t3 - t2 > 1){
								this.oLRC.olrc = false;
							}else{
								this.oLRC.olrc = true;
							}
						}
					}
				}
			}
		}
		
		if(this.debug){
			if(this.oLRC.olrc){
				console.log('单行歌词');
			}else{
				console.log('多行歌词');
			}
		}
		
		let cvs = document.getElementById(this.testcanvas)
		
		if(this.oLRC.olrc){
			let cvsx = cvs.getContext("2d")
			cvsx.font = this.rander_font;
			cvsx.fillStyle = "coral";
			
			for(let i in lrcs) {//遍历歌词数组
				lrcs[i] = lrcs[i].replace(/(^\s*)|(\s*$)/g, ""); //去除前后空格
				//console.log('去除前后空格' + lrcs[i]);
			    let t = lrcs[i].substring(lrcs[i].indexOf("[") + 1, lrcs[i].indexOf("]"));//取[]间的内容
			    let s = t.split(":");//分离:前后文字  例如:[by:aaa]分离成 [by,aaa]
				//console.log(s[0]);
				//判断:前是否是数字以判断是否是时间戳
			    if(isNaN(parseInt(s[0]))) { //不是数值
					//判断不是数字
			        for (let i in this.oLRC) {
			            if (i != "ms" && i == s[0].toLowerCase()) {
			                this.oLRC[i] = s[1];
			            }
			        }
			    }else { //是数值
					//是数值则为歌词
			        let arr = lrcs[i].match(/\[(\d+:.+?)\]/g);//提取时间字段，可能有多个  | 例如: [00:18.50][01:21.92]ok  代表18秒和1分21秒有歌词ok 合并成 [00:18.50]ok [01:21.92]ok
			        let start = 0;
			        for(let k in arr){
			            start += arr[k].length; //计算歌词位置
			        }
			        let content = lrcs[i].substring(start);//获取歌词内容
					
			        for (let k in arr){
			            let t = arr[k].substring(1, arr[k].length-1);//取[]间的内容
			            let s = t.split(":");//分离:前后文字
			            this.oLRC.ms.push({//对象{t:时间,c:歌词}加入ms数组
			                t: parseFloat((parseFloat(s[0])*60+parseFloat(s[1])).toFixed(3)),
			                c: content,
							width: cvsx.measureText(content).width
			            });
			        }
			    }
			}
			let i = this.oLRC.ms.length;

			//处理排序
			while (i > 0) {
				for (let j = 0; j < i - 1; j++) {
					if (this.oLRC.ms[j].t > this.oLRC.ms[j + 1].t || this.oLRC.ms[j].t == this.oLRC.ms[j + 1].t) {
						let temp_exc = this.oLRC.ms[j];
						this.oLRC.ms[j] = this.oLRC.ms[j + 1];
						this.oLRC.ms[j + 1] = temp_exc;
					}
				}
				i--;
			}

			for (let i = 0; i < this.oLRC.ms.length; i++) {
				if(i == 0){
					if(this.oLRC.ms[i].t > 0 && (this.oLRC.ms[i].t - 0) > 8){
						this.countdown.arr.push({
							index: i,
							start: this.oLRC.ms[i].t - 5,
							end: this.oLRC.ms[i].t
						});
					}
					continue
				}
				if(i + 1 < this.oLRC.ms.length){
					if(this.oLRC.ms[i + 1].t > this.oLRC.ms[i].t && (this.oLRC.ms[i + 1].t - this.oLRC.ms[i].t) > 8){
						this.countdown.arr.push({
							index: i + 1,
							start: this.oLRC.ms[i + 1].t - 5,
							end: this.oLRC.ms[i + 1].t
						});
					}
				}
			}
			
			//Lrc_query.ci = this.oLRC.ms.length;
			this.maxline = this.oLRC.ms.length;
			if(this.debug)console.log("载入完成","数组长度" + this.oLRC.ms.length)
		}else{
			let cvsx = cvs.getContext("2d")
			cvsx.font = this.rander_font;
			cvsx.fillStyle = "coral";
			
			let lpdall = {
				t: [],
				c: [],
				al: [],
				width: []
			}
			let lrccount = 0;
			for(let i in lrcs) {//遍历歌词数组
				lrcs[i] = lrcs[i].replace(/(^\s*)|(\s*$)/g, ""); //去除前后空格
				//console.log('去除前后空格' + lrcs[i]);
			    let t = lrcs[i].substring(lrcs[i].indexOf("[") + 1, lrcs[i].indexOf("]"));//取[]间的内容
			    let s = t.split(":");//分离:前后文字  例如:[by:aaa]分离成 [by,aaa]
				//console.log(s[0]);
				//判断:前是否是数字以判断是否是时间戳
			    if(isNaN(parseInt(s[0]))) { //不是数值
					//判断不是数字
			        for (let i in this.oLRC) {
			            if (i != "ms" && i == s[0].toLowerCase()) {
			                this.oLRC[i] = s[1];
			            }
	
						if(s[0] == "offset"){
							this.oLRC.offset = parseInt(s[1])
							console.log("歌词偏移:",this.oLRC.offset)
						}
			        }
			    }else { //是数值
					//是数值则为歌词
					let arr2 = lrcs[i].split(']');
					let arr3 = [];
					let arr4 = [];
					let appendString = "";//完整句
					for (let l in arr2) {
						if(arr2[l].indexOf('[') != -1 && l > 0){
							let lq = l - 1;
							arr3[lq] = arr2[l].substring(0,arr2[l].indexOf('['));
							//lpd.c[lq] = arr2[l].substring(0,arr2[l].indexOf('['));
							appendString += arr3[lq];
						}else{
							if(l > 0){
								let lq = l - 1;
								arr3[lq] = arr2[l].substring(arr2[l - 1].indexOf('['),arr2[l].length);
								appendString += arr3[lq];
							}
						}
						
						if(arr2[l].indexOf('[') != -1 && arr2[l].length > 0){
							let kpd = arr2[l]. substring(arr2[l].indexOf('[') + 1,arr2[l].length);
							let s = kpd.split(":");//分离:前后文字
							arr4[l] = parseFloat((parseFloat(s[0])*60+parseFloat(s[1])).toFixed(3));
						}
					}
					
					lpdall.t[lrccount] = arr4;			//每一句时间 数组
					lpdall.c[lrccount] = arr3;			//每一句歌词 数组
					lpdall.al[lrccount] = appendString;	//完整句歌词 数组
					lpdall.width[lrccount] = cvsx.measureText(appendString).width;	//字符宽度
					lrccount++;//计数
				}
			}
			let i = this.oLRC.ms.length;
			this.oLRC.ms = lpdall;
			
			
			for (let i = 0; i < this.oLRC.ms.t.length; i++) {
				if(i == 0){
					if(this.oLRC.ms.t[i + 1][0] > 0 && (this.oLRC.ms.t[i + 1][0] - 0) > 8){
						this.countdown.arr.push({
							index: i,
							start: this.oLRC.ms.t[i][0] - 5,
							end: this.oLRC.ms.t[i][0]
						});
					}
					continue
				}
				if(i + 1 < this.oLRC.ms.t.length){
					console.log()
					let lenx = this.oLRC.ms.t[i].length - 1;
					if(this.oLRC.ms.t[i + 1][0] > this.oLRC.ms.t[i][lenx] && (this.oLRC.ms.t[i + 1][0] - this.oLRC.ms.t[i][lenx]) > 8){
						this.countdown.arr.push({
							index: i + 1,
							start: this.oLRC.ms.t[i + 1][0] - 5,
							end: this.oLRC.ms.t[i + 1][0]
						});
					}
				}
			}
			
			if(this.debug)console.log("载入完成","时间" + lpdall.t.length,"歌词" + lpdall.c.length,"完整句" + lpdall.al.length,"宽度" + lpdall.width.length)
			this.maxline = this.oLRC.ms.t.length;
		}
		if(this.debug)console.log(this.oLRC)
		this.render();
	}
	
	this.ref_lrc = function(){
		let p_status=this.audio.playerStatus.paused;
		let t_status=this.audio.seek() + (this.Global_lrc_offset / 1000) + (this.oLRC.offset / 1000);
		if(this.oLRC.olrc){
			if(!p_status){
				//if(this.debug)console.log(p_status,this.oLRC.olrc);
				let time_s = t_status;
				for (let a = 0; a < this.maxline; a++) { //循环
					if (this.oLRC.ms[a].t < time_s) {
						if (this.maxline > 1) {
							let lens = this.oLRC.ms.length;
							if(a + 1 < this.maxline){
								if(this.oLRC.ms[a+1].t > time_s){
									//if(this.debug)console.log((this.oLRC.ms[a].t - time_s).toFixed(4))
									this.nowline = a;
									this.nowperc = 1;
								}
							}else{
								//最后一行
								this.nowline = this.maxline - 1;
								this.nowperc = 1;
							}
						}
					}
				}

				let refsx = false;
				let oks = false;
				for (let k = 0;k < this.countdown.arr.length;k++) {
					let tmp1 = this.countdown.arr[k];
					if(oks)continue;
					if(tmp1.start < time_s && tmp1.end > time_s){
						let countsec = (this.countdown.arr[k].end - time_s).toFixed(0);
						this.countdown.stat = true;
						this.countdown.now = countsec;
						let x = "";
						for (let i = 0; i < this.countdown.now; i++) {
							x = countsec;
						}
						if(this.countdown.apps != x){
							this.countdown.apps = x;
						}
						refsx = true;
						oks = true;
					}
				}
				if(refsx == false || oks == false){
					this.countdown.now = this.countdown.max;
					this.countdown.stat = false;
					let x = "";
					if(this.countdown.apps != x){
						this.countdown.apps = x;
					}
				}
			}
		}else{
			if(!p_status){
				let time_s = t_status; //当前播放时间
				for (let a = 0; a < this.maxline; a++) { //循环
					if (this.oLRC.ms.t[a][0] < time_s) {
						let con = document.getElementById(this.testcanvas).getContext("2d");
						con.font = this.rander_font;
						con.fillStyle = "coral";
						if (this.maxline > 1) {
							let lens = this.oLRC.ms.t[a].length;
							let t_con = "";	//已唱的歌词
							let p = 0;		//字符长度 用于判断字的位置
							//判断这句下面是否还有歌词 没有就是最后一句
							if(a + 1 < this.maxline){
								if(this.oLRC.ms.t[a+1][0] > time_s) {
									//if(this.debug)console.log(this.oLRC.ms.t[a]);
									for(let g=0;g<lens;g++){
										if(this.oLRC.ms.t[a][g] < time_s){
											t_con += this.oLRC.ms.c[a][g];		//已唱的歌词
											p = g;
										}
									}
									this.nowline = a;
									
									let gpps = con.measureText(this.oLRC.ms.c[a][p]).width; //当前唱的字的宽度
									let gpps2 = con.measureText(t_con).width; 				//计算当前已唱部分宽度
									//console.log((g +1) < (lens - 1), g +1,lens - 1)
									if((p + 1) < lens){ //判断是否到最后一个字
										let ggp = this.oLRC.ms.t[a][p+1] - this.oLRC.ms.t[a][p]; 	//当前行下一个字时间差
										let ggp2 = this.oLRC.ms.t[a][p+1] - time_s;					//计算下一个字离当前时间有多久
										
										let kkg = (gpps2 - gpps) + ((Math.abs(1 - (ggp2 / ggp))).toFixed(3) * gpps);
										this.nowperc = kkg / this.oLRC.ms.width[a];
										//当前已唱宽度 + 当前正在唱的百分比 * 当前唱的字的宽度
										//console.log(gpps,gpps2,ggp,ggp2,this.curX)
										//console.log(oLRC.ms.c[a][g],(Math.abs(1 - (ggp2 / ggp))).toFixed(3));
										if(this.countdown.stat!=false){
											this.countdown.stat = false;
										}
									}else{
										//是最后一个字就设置为这一句歌词的宽度
										this.nowperc = 1;
										
										let refsx = false;
										let oks = false;
										for (let k = 0;k < this.countdown.arr.length;k++) {
											let tmp1 = this.countdown.arr[k];
											if(oks)continue;
											if(tmp1.start < time_s && tmp1.end > time_s){
												let countsec = (this.countdown.arr[k].end - time_s).toFixed(0);
												this.countdown.stat = true;
												this.countdown.now = countsec;
												let x = "";
												for (let i = 0; i < this.countdown.now; i++) {
													x = countsec;
												}
												if(this.countdown.apps != x){
													this.countdown.apps = x;
												}
												refsx = true;
												oks = true;
											}
										}
										if(refsx == false || oks == false){
											this.countdown.now = this.countdown.max;
											this.countdown.stat = false;
											let x = "";
											if(this.countdown.apps != x){
												this.countdown.apps = x;
											}
										}
									}
									
								}
							}else{
								//最后一句
								for(let g=0;g<lens;g++){
									if(this.oLRC.ms.t[a][g] < time_s){
										t_con += this.oLRC.ms.c[a][g];
										p = g;
									}
								}
								this.nowline = this.maxline - 1;
								
								if (this.oLRC.ms.t[a][p+1] > time_s) {
									let gpps = con.measureText(this.oLRC.ms.c[a][p]).width;
									let gpps2 = con.measureText(t_con).width;
									if(p < lens - 1){
										//console.log(con.measureText(t_con).width,con.measureText(ltext).width)										
										let ggp = this.oLRC.ms.t[a][p+1] - this.oLRC.ms.t[a][p];
										let ggp2 = this.oLRC.ms.t[a][p+1] - time_s;
										
										let kkg = (gpps2 - gpps) + ((Math.abs(1 - (ggp2 / ggp))).toFixed(3) * gpps);
										this.nowperc = kkg / this.oLRC.ms.width[a];
										//console.log(oLRC.ms.c[a][g],(Math.abs(1 - (ggp2 / ggp))).toFixed(3));
										
										if(this.countdown.stat!=false){
											this.countdown.stat = false;
										}
									}else{
										this.nowperc = 1;
										
										let refsx = false;
										let oks = false;
										for (let k = 0;k < this.countdown.arr.length;k++) {
											let tmp1 = this.countdown.arr[k];
											if(oks)continue;
											if(tmp1.start < time_s && tmp1.end > time_s){
												let countsec = (this.countdown.arr[k].end - time_s).toFixed(0);
												this.countdown.stat = true;
												this.countdown.now = countsec;
												let x = "";
												for (let i = 0; i < this.countdown.now; i++) {
													x = countsec;
												}
												if(this.countdown.apps != x){
													this.countdown.apps = x;
												}
												refsx = true;
												oks = true;
											}
										}
										if(refsx == false || oks == false){
											this.countdown.now = this.countdown.max;
											this.countdown.stat = false;
											let x = "";
											if(this.countdown.apps != x){
												this.countdown.apps = x;
											}
										}
									}
								}
							}
						}
						con = null;
					} else {
						continue;
					}
				}
				time_s = null;
			}
		}
		p_status = null;
		t_status = null;
		this.render();
	}
	
	/* canvas */
	this.render = function(){
		let p = this;
		for (let i = 0;i < this.canvasCount;i++) {
			if(typeof p.canvasList[i] == 'undefined'){
				continue;
			}
			let con = p.canvasList[i].getContext("2d");
			let tmpCanvasWidth = p.canvasList[i].width;
			con.fillStyle = "#abcdef";
			con.clearRect(0, 0, tmpCanvasWidth , p.canvasList[i].height);
			con.save();
			con.font = p.rander_font;
			con.textAlign = "left";

			if(p.countdown.stat && i == 0){
				con.fillStyle = "coral";
				con.fillText(this.countdown.apps, tmpCanvasWidth / 2, 32);
			}
			if(this.oLRC.olrc){
				if(p.nowline + i >= p.maxline){
					con.fillText("", 0, 32);
				}else{
					if(i == 0){
						con.fillStyle = "coral";
					}else{
						con.fillStyle = "#abcdef";
					}
					if(p.countdown.stat && p.nowline == 0 || p.countdown.stat && i!= 0){
						let left_ = (tmpCanvasWidth / 2) - (p.oLRC.ms[p.nowline + i - 1].width / 2);
						con.fillText(p.oLRC.ms[p.nowline + i - 1].c, left_, 32);
					}else{
						let left_ = (tmpCanvasWidth / 2) - (p.oLRC.ms[p.nowline + i].width / 2);
						if(!p.countdown.stat){
							con.fillText(p.oLRC.ms[p.nowline + i].c, left_, 32);
						}else{
							if(i != 0){
								con.fillText(p.oLRC.ms[p.nowline + i].c, left_, 32);
							}
						}
					}
				}
				con.save();
			}else{
				if(p.nowline + i >= p.maxline){
					con.fillText("", 0, 32);
				}else{
					let left_ = 0;
					if(p.countdown.stat && p.nowline == 0){
						left_ = (tmpCanvasWidth / 2) - (p.oLRC.ms.width[p.nowline + i - 1] / 2);
						con.fillText(p.oLRC.ms.al[p.nowline + i - 1], left_, 32);
					}else{
						left_ = (tmpCanvasWidth / 2) - (p.oLRC.ms.width[p.nowline + i] / 2);
						if(!p.countdown.stat){
							con.fillText(p.oLRC.ms.al[p.nowline + i], left_, 32);
						}else{
							if(i != 0){
								con.fillText(p.oLRC.ms.al[p.nowline + i], left_, 32);
							}
						}
					}
					con.save();

					if(!p.countdown.stat && i == 0){
						let curX = 0;
						let nowt = "";
						if(p.countdown.stat){
							curX = p.oLRC.ms.width[p.nowline + i - 1] * p.nowperc;
							nowt = p.oLRC.ms.al[p.nowline + i - 1];
						}else{
							curX = p.oLRC.ms.width[p.nowline + i] * p.nowperc;
							nowt = p.oLRC.ms.al[p.nowline + i];
						}
						con.fillStyle = "coral";
						con.beginPath();
						con.rect(left_, 0, curX, 90);//裁剪没有播放到的位置
						con.closePath();
						con.clip();
						con.fillText(nowt, left_, 32);
						con.restore();
					}else{
						con.fillStyle = "#abcdef";
					}
				}
				con.save();
			}
		}
		/*
		if(p.debug == true){
			let cvs = document.getElementById(p.testcanvas);
			//console.log(cvs)
			try {
				if(typeof cvs.getContext("2d") != null || typeof cvs != null){
					let cvsx = cvs.getContext("2d");
					cvsx.clearRect(0, 0, cvs.width, cvs.width);
					cvsx.save();
					cvsx.font = p.rander_font;
					cvsx.fillStyle = "#abcdef";
					
					cvsx.fillText((p.nowperc * 100).toFixed(1) + "%  " + p.countdown.stat, 0, 32);
					cvsx.fillText((p.audio.seek()).toFixed(2) + "/" + (p.audio.duration()).toFixed(2), 0, 64);
					cvsx.save();
				}
			} catch (error) {
				
			}
		}
		*/
	}
}