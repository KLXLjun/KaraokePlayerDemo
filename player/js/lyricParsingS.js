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

	this.loadStop = false;
	
	this.timer = setInterval(() => {
		if(this.loadStop){
			this.ref_lrc();
		}
	}, this.Refresh_interval);
	
	this.canvas.addEventListener("mousewheel",(e) => {
		//console.log(e)
		// this.drawWorker.postMessage({
		// 	commends:"MouseWheel",
		// 	f:e.deltaY * 0.2
		// });
	});
	this.lrcup = true;
	
	this.canvase = {
		width:this.canvas.width,
		height:this.canvas.height
	}
	
	//初始化
	this.init = (lrc) => {
		this.loadStop = false;
		this.canvase = {
			width:this.canvas.width,
			height:this.canvas.height
		}
		
		con = this.canvas.getContext("2d");
		fonth = 32;
		k = fonth / 2;
		fontname = 'Microsoft YaHei';
		fontheigth = measureText(32, 'Microsoft YaHei', "abc测试123");
		this.inputnow = 0;
		this.lper = 0;
		
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
	this.read_lrc = () => {
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
		
		let callx = [];
		if(this.oLRC.olrc){
			callx = this.oLRC.ms;
		}else{
			let bks = [];
			for (let i = 0; i<this.oLRC.ms.al.length;i++) {
				bks.push({
					t:this.oLRC.ms.t[i][0],
					c:this.oLRC.ms.al[i]
				});
			}
			callx = bks;
		}

		uplock = true;
		con.font = fonth + "px " + fontname;
		let o = 0;
		for (let va in callx) {
			callx[va].width = con.measureText(callx[va].c).width;
			o += fonth + hz;
			callx[va].offset = o;
		}
		uplock = false;
		xxslock = true;

		allx = callx;
		
		//console.log(this.oLRC)
		this.loadStop = true;
		this.ref_lrc();
		console.log(allx);
	}
	
	this.ref_lrc = () => {
		if(!this.audio){
			return 
		}
		let p_status=this.audio.playerStatus.paused;
		let t_status=this.audio.seek() + (this.Global_lrc_offset / 1000) + (this.oLRC.offset / 1000);
		let findok = false;
		if(this.oLRC.olrc){
			if(!p_status){
				//if(this.debug)console.log(p_status,this.oLRC.olrc);
				let time_s = t_status;
				for (let a = 0; a < Lrc_query.ci; a++) { //循环
					if (this.oLRC.ms[a].t < time_s) {
						if (Lrc_query.ci > 1) {
							if(a + 1 < Lrc_query.ci){
								if(this.oLRC.ms[a+1].t > time_s){
									//console.log(this.oLRC.ms[a].c)
									this.lper = per;
									this.inputnow = a;
									findok = true;
								}
							}else{
								//最后一行
								//console.log(this.oLRC.ms[a].c)
								this.lper = per;
								this.inputnow = a;
								findok = true;
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
									// this.drawWorker.postMessage({
									// 	commends: "ref",
									// 	now: a,
									// 	per: per
									// });
									this.lper = per;
									this.inputnow = a;
									findok = true;
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
								this.lper = per;
								this.inputnow = a;
								findok = true;
							}
						}
					} else {
						continue;
					}
				}
			}
		}
		if(!findok){
			this.lper = 0;
			this.inputnow = 0;
		}
		ref_canvas();
	}

	function secondToDate(result) {
		let m = Math.floor((result / 60 % 60)) < 10 ? '0' + Math.floor((result / 60 % 60)) : Math.floor((result / 60 % 60));
		let s = Math.floor((result % 60)) < 10 ? '0' + Math.floor((result % 60)) : Math.floor((result % 60));
		return result = m + ":" + s;
	}	
	
	function measureText(fontSize, fontFamily, text) {
		let span = document.getElementById("testfontsizelps") || document.createElement("span");
		let result = {
		   width: 0,
		   height: 0
		};
		span.id = "testfontsizelps";
		span.style.visibility = "hidden";
		span.style.fontSize = fontSize + "px";//文字大小
		span.style.fontFamily = fontFamily;//字体
		span.style.display = "inline-block";
		if(!document.getElementById("testfontsizelps")){
			document.body.appendChild(span);
		}
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

	
	// 歌词渲染
 	let allx = null;	//歌词数组
	let uplock = false;	//数组读取锁定
	let fonth = 0;		//字体大小
	let hz = 12;		//行间距
	let gdoffset = 0;	//缓动
	this.inputnow = 0;	//输入显示行
	this.outnow = 0;	//当前显示行
	let sco = 0;		//滚动量
	let scolock = false;//滚动锁定
	let timer = null;	//滚动倒计时
	let pos = 0;		//滚动锁定时位置
	let xxslock = false;//强制刷新锁 true即刷新一次
	let fontname = 'Microsoft YaHei' //字体名称
	let fontheigth = 0;
	this.lper = 0;
	var ref_canvas = () => {
		// let con = this.con;
		let tfs = this.canvase;
		let nowa = allx[this.inputnow];
		if(allx != null && !uplock && con != null){
			let h2 = (this.canvase.height / 2);
			if(!scolock){
				pos = nowa.offset;
			}else{
				pos += sco;
				if(pos < h2){
					pos = h2;
				}
				sco = 0;
			}
			
			if((this.outnow != this.inputnow && gdoffset < 1 && !scolock)){
				this.outnow = this.inputnow;
				gdoffset = fonth + hz;
			}
			
			if(gdoffset < 2){
				gdoffset = 0;
				if(xxslock){
					xxslock = false;
				}else{
					// if(!scolock){
					// 	return
					// }
				}
			}
			con.clearRect(0, 0, this.canvase.width, this.canvase.height);
			con.save();
			
			con.font = fonth + "px " + fontname;
			con.fillStyle = "coral";
			con.textAlign = "center";
			let l = fonth + hz + gdoffset;
			if(uplock){
				return
			}
			if(typeof allx[this.outnow] == "undefined"){
				return
			}
			if(allx[this.outnow].offset < h2 && !scolock){
				l += h2 - nowa.offset - (fonth + hz);
			}else{
				l -= (fonth + hz) * 2;
			}
			let y1;
			let y2;
			
			if(!scolock){
				y1 = nowa.offset - h2;
				y2 = nowa.offset + h2;
			}else{
				y1 = pos - h2;
				y2 = pos + h2;
			}
			
			con.globalCompositeOperation = "source-over";
			
			for (let va in allx) {
				let p = allx[va];
				if(p.offset > y1 && p.offset < y2){
					l += fonth + hz;
					if(va == this.outnow){
						con.fillStyle = "#B8B8B8";
						con.fillText(p.c, (tfs.width / 2), l);
						con.fillText(p.c, (tfs.width / 2) + 1, l + 1);
						con.save();
						
						if(this.lper != -1){
							con.save();
							con.rect((tfs.width / 2) - (p.width / 2), l - fontheigth.height + 8, p.width * this.lper, fontheigth.height);
							con.clip();

							con.fillStyle = "#ce0003";
							con.fillText(p.c, (tfs.width / 2), l);
							con.restore();
							con.save();
						}else{
							con.fillStyle = "#B8B8B8";
							con.fillText(p.c, (tfs.width / 2) + 1, l + 1);
							con.fillText(p.c, (tfs.width / 2), l);
							con.save();
						}
					}else{
						con.fillStyle = "#B8B8B8";
						con.fillText(p.c, (tfs.width / 2) + 1, l + 1);
						con.fillText(p.c, (tfs.width / 2), l);
						con.save();
					}
					con.save();
				}
			}
			if(gdoffset > 0 && !scolock){
				gdoffset = gdoffset - (gdoffset / 8);
			}
			
			//锁定
			if(scolock){
				con.fillStyle = "#FFFFFF";
				con.beginPath();
				con.moveTo(0, h2 + 2);
				con.lineTo(this.canvase.width, h2 + 2);
				con.stroke();
			}
			
			//上下渐变
			con.beginPath();
			con.globalCompositeOperation = "destination-out";
			
			let t = con.createLinearGradient(0, 0, 0, 64);
			t.addColorStop(0, "rgba(255,255,255,1)");
			t.addColorStop(1, "rgba(255,255,255,0)");
			
			con.fillStyle = t;
			con.fillRect(0, 0, this.canvase.width, 64);
			
			con.save();
			
			con.beginPath();
			let t2 = con.createLinearGradient(0, this.canvase.height - 64, 0,this.canvase.height);
			
			t2.addColorStop(0, "rgba(255,255,255,0)");
			t2.addColorStop(1, "rgba(255,255,255,1)");
			
			con.fillStyle = t2;
			con.fillRect(0, this.canvase.height - 64, this.canvase.width, 64);
			
			con.save();
		}
	}
}