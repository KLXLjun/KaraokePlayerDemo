function lyricParsingS(option){
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
	    ms: [] //歌词数组{t:时间,c:歌词}
	};
	this.Refresh_interval = typeof option.reftime != "undefined" ? option.reftime : 16;
	
	this.widthcalccanvas = document.createElement("canvas")
	
	///歌词部分
	this.lrc_top = 0;
	this.lrc_offset = 0;
	
	this.drawWorkerPath = typeof option.draw!="undefined" ? option.draw : undefined;
	this.drawWorker = new Worker(this.drawWorkerPath); 
	this.offScreenW = this.canvas.transferControlToOffscreen();
	this.offScreenWok = false;
	
	this.drawWorker.onmessage = function (event) {
		let data = event.data;
		alert(JSON.stringify(data));
	}

	this.loadStop = false;
	
	this.timer = setInterval(() => {
		if(this.loadStop){
			this.ref_lrc();
		}
	}, this.Refresh_interval);
	
	this.canvas.addEventListener("mousewheel",(e) => {
		//console.log(e)
		this.drawWorker.postMessage({
			commends:"MouseWheel",
			f:e.deltaY * 0.2
		});
	});
	this.lrcup = true;
	
	this.canvase = {
		width:this.canvas.width,
		height:this.canvas.height
	}
	
	//初始化
	this.init = function(lrc){
		this.loadStop = false;
		if(!this.offScreenWok){
			this.drawWorker.postMessage({
				commends: "OffScreenSet",
				canvas: this.offScreenW
			},[this.offScreenW]);
			this.offScreenWok = true
		}
		
		this.drawWorker.postMessage({
			commends: "FontSizeSet",
			size: 32,
			font: 'Microsoft YaHei',
			heig: measureText(32, 'Microsoft YaHei', "abc测试123")
		});
		
		this.canvas.addEventListener("scroll", function(e){
			onsole.log(e)
		});
		
		if(lrc){
			this.lrc = lrc
			this.read_lrc();
		}
	}

	this.clear = function(){
		//clearInterval(this.timer)
	}
	
	var Lrc_query={
		//lrc_height:34, //每行歌词高度 class = lrc
		ci:0, // 歌词数量
		dishang:0 //当前显示行
	}
	
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
		let time_expression = /<([0-9]+):([0-9]+).([0-9]+)>/i
		for (let i = 0;i < lrcs.length;i++) {
			let no = true;
			for(;no;){
				let ele = lrcs[i];
				let m = ele.search(time_expression);
				if(m > 0){
					let tmx = ele.substr(m,10);
					ele = ele.replace(tmx,"[" + ele.substr(m + 1,8) + "]");
					lrcs[i] = ele;
				}else{
					no = false
				}
			}
		}
		if(this.debug)console.log(lrcs);
		
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
							if(this.debug)console.log('单行歌词');
						}else{
							if(t3 - t2 > 1){
								this.oLRC.olrc = false;
								if(this.debug)console.log('多行歌词');
							}else{
								this.oLRC.olrc = true;
								if(this.debug)console.log('单行歌词');
							}
						}
					}
				}
			}
		}
		
		if(this.oLRC.olrc){
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
			                c: content
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
			
			Lrc_query.ci = this.oLRC.ms.length;
		}else{
			let lpdall = {
				t: [],
				c: [],
				al: []
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
					
					//console.log(arr3,arr4);
					lpdall.t[lrccount] = arr4;//每一句时间 数组
					lpdall.c[lrccount] = arr3;//每一句歌词 数组
					lpdall.al[lrccount] = appendString;//完整句歌词 数组
					lrccount++;//计数
			    }
			}
			//console.log(lpdall)
			let i = this.oLRC.ms.length;
			if(this.debug)console.log(this.oLRC);
			this.oLRC.ms = lpdall;
			Lrc_query.ci = this.oLRC.ms.t.length;
		}
		//console.groupEnd();
		if(this.debug)console.log(this.oLRC)
		
		if(this.oLRC.olrc){
			this.drawWorker.postMessage({
				commends: "ReadLrc",
				all: this.oLRC.ms
			});
		}else{
			let bks = [];
			console.log(this.oLRC)
			for (let i = 0; i<this.oLRC.ms.al.length;i++) {
				bks.push({
					t:this.oLRC.ms.t[i][0],
					c:this.oLRC.ms.al[i]
				});
			}
			if(this.debug)console.log(bks)
			this.drawWorker.postMessage({
				commends: "ReadLrc",
				all: bks
			});
		}
		this.loadStop = true;
		setTimeout(()=>{
			this.drawWorker.postMessage({
				commends: "ref",
				now: 0
			});
		},1);
	}
	
	this.ref_lrc = function(){
		let p_status=this.audio.playerStatus.paused;
		let t_status=this.audio.seek() + (this.Global_lrc_offset / 1000) + (this.oLRC.offset / 1000);
		if(this.oLRC.olrc){
			if(!p_status){
				//if(this.debug)console.log(p_status,this.oLRC.olrc);
				let time_s = t_status;
				for (let a = 0; a < Lrc_query.ci; a++) { //循环
					if (this.oLRC.ms[a].t < time_s) {
						if (Lrc_query.ci > 1) {
							let lens = this.oLRC.ms.length;
							if(a + 1 < Lrc_query.ci){
								if(this.oLRC.ms[a+1].t > time_s){
									//console.log(this.oLRC.ms[a].c)
									this.drawWorker.postMessage({
										commends: "ref",
										now: a
									});
								}
							}else{
								//最后一行
								//console.log(this.oLRC.ms[a].c)
								this.drawWorker.postMessage({
									commends: "ref",
									now: a
								});
							}
						}
					}
				}
			}
		}else{
			if(!p_status){
				let time_s = t_status; //当前播放时间
				for (let a = 0; a < Lrc_query.ci; a++) { //循环
					if (this.oLRC.ms.t[a][0] < time_s) {
						if (Lrc_query.ci > 1) {
							let con = this.widthcalccanvas.getContext("2d");
							con.font = this.Rander_font;
							con.fillStyle = "coral";
							//console.log(a,Lrc_query.ci,a + 1 > Lrc_query.ci)
							let lens = this.oLRC.ms.t[a].length;
							let t_con = "";	//已唱的歌词
							let p = 0;		//字符长度 用于判断字的位置
							//判断这句下面是否还有歌词 没有就是最后一句
							if(a + 1 < Lrc_query.ci){
								if (this.oLRC.ms.t[a+1][0] > time_s) {
									//if(this.debug)console.log(this.oLRC.ms.t[a]);
									for(let g=0;g<lens;g++){
										if(this.oLRC.ms.t[a][g] < time_s){
											t_con += this.oLRC.ms.c[a][g];		//已唱的歌词
											p = g;
										}
									}
									if(this.debug)console.log(t_con);
									
									let per = 0;
									
									let gpps = con.measureText(this.oLRC.ms.c[a][p]).width;//当前唱的字的宽度
									//console.log((g +1) < (lens - 1), g +1,lens - 1)
									if((p + 1) < lens){ //判断是否到最后一个字
										//console.log(con.measureText(t_con).width,con.measureText(ltext).width)
										let gpps2 = con.measureText(t_con).width; 					//计算当前已唱部分宽度
										let ggp = this.oLRC.ms.t[a][p+1] - this.oLRC.ms.t[a][p]; 	//当前行下一个字时间差
										let ggp2 = this.oLRC.ms.t[a][p+1] - time_s;					//计算下一个字离当前时间有多久
										this.curX = (gpps2 - gpps) + ((Math.abs(1 - (ggp2 / ggp))).toFixed(3) * gpps);
										per = this.curX / con.measureText(this.oLRC.ms.al[a]).width
										//当前已唱宽度 + 当前正在唱的百分比 * 当前唱的字的宽度
										//console.log(gpps,gpps2,ggp,ggp2,this.curX)
										//console.log(oLRC.ms.c[a][g],(Math.abs(1 - (ggp2 / ggp))).toFixed(3));
									}else{
										//是最后一个字就设置为这一句歌词的宽度
										this.curX = con.measureText(t_con).width;
										per = 1;
									}
									this.drawWorker.postMessage({
										commends: "ref",
										now: a,
										per: per
									});
								}
							}else{
								//最后一句
								for(let g=0;g<lens;g++){
									if(this.oLRC.ms.t[a][g] < time_s){
										t_con += this.oLRC.ms.c[a][g];
										p = g;
									}
								}
								
								let gpps = con.measureText(this.oLRC.ms.c[a][p]).width;//当前唱的字的宽度
								//console.log((g +1) < (lens - 1), g +1,lens - 1)
								if((p + 1) < lens){ //判断是否到最后一个字
									//console.log(con.measureText(t_con).width,con.measureText(ltext).width)
									let gpps2 = con.measureText(t_con).width; 					//计算当前已唱部分宽度
									let ggp = this.oLRC.ms.t[a][p+1] - this.oLRC.ms.t[a][p]; 	//当前行下一个字时间差
									let ggp2 = this.oLRC.ms.t[a][p+1] - time_s;					//计算下一个字离当前时间有多久
									this.curX = (gpps2 - gpps) + ((Math.abs(1 - (ggp2 / ggp))).toFixed(3) * gpps);
									per = this.curX / con.measureText(this.oLRC.ms.al[a]).width
									//当前已唱宽度 + 当前正在唱的百分比 * 当前唱的字的宽度
									//console.log(gpps,gpps2,ggp,ggp2,this.curX)
									//console.log(oLRC.ms.c[a][g],(Math.abs(1 - (ggp2 / ggp))).toFixed(3));
								}else{
									//是最后一个字就设置为这一句歌词的宽度
									this.curX = con.measureText(t_con).width;
									per = 1;
								}
								this.drawWorker.postMessage({
									commends: "ref",
									now: a,
									per: per
								});
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
	}
	
	/* canvas */
	this.render = function(){
		let con = this.canvas.getContext("2d")
		con.clearRect(0, 0, this.canvase.width, this.canvase.width);
		con.save();
		//上半部分
		
		//先绘制第一句歌词 (整句)
		con.save();
		con.font = this.rander_font;
		con.fillStyle = "#abcdef";
		con.fillText(this.ltext, this.leftX1, 32);
		con.restore();
	
		con.save();
		con.beginPath();
		
		//裁剪没有播放到的位置
		con.rect(this.leftX1, 0, this.curX, 90);
		con.closePath();
		con.clip();
	
		//绘制当前播放歌词
		con.font = this.rander_font;
		con.fillStyle = "coral";
		con.fillText(this.ltext, this.leftX1, 32);
		con.restore();
		
		
		//下半部分歌词
		con.save();
		con.font = this.rander_font;
		con.fillStyle = "#abcdef";
		con.fillText(this.ltext2, this.leftX2, 72);
		con.restore();
		
		con.save();
		con.beginPath();
		
		con.rect(this.leftX2, 32, this.curX2, 60);
		con.closePath();
		con.clip();
		
		con.font = this.rander_font;
		con.fillStyle = "coral";
		con.fillText(this.ltext2, this.leftX2, 72);
		con.restore();
	}

	function secondToDate(result) {
		let m = Math.floor((result / 60 % 60)) < 10 ? '0' + Math.floor((result / 60 % 60)) : Math.floor((result / 60 % 60));
		let s = Math.floor((result % 60)) < 10 ? '0' + Math.floor((result % 60)) : Math.floor((result % 60));
		return result = m + ":" + s;
	}	
	
	function measureText(fontSize, fontFamily, text) {
		var span = document.createElement("span");
		var result = {
		   width: 0,
		   height: 0
		};
		span.style.visibility = "hidden";
		span.style.fontSize = fontSize + "px";//文字大小
		span.style.fontFamily = fontFamily;//字体
		span.style.display = "inline-block";
		document.body.appendChild(span);
		if (typeof span.textContent != "undefined") {
			span.textContent = text;
		} else {
			span.innerText = text;
		}
		//使用window.getComputedStyle方法获取
		result.width = parseFloat(window.getComputedStyle(span).width) || span.offsetWidth;
		result.height = parseFloat(window.getComputedStyle(span).height) || span.offsetHeight;
		return result;
	}
}