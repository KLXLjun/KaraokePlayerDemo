function lyricParsingV(option){
	this.Ver = "0.0.1";
	this.AudioEl = typeof option.Audio!="undefined" ? option.Audio : undefined;
	this.Debug = typeof option.Debug!="undefined" && typeof option.Debug=="boolean" ? option.Debug : false;
	this.GlobalLrcOffset = typeof option.offset!="undefined" && typeof option.offset=="number" ? option.offset : 0;
	this.RanderFont = typeof option.RanderFont!="undefined" && typeof option.RanderFont=="string" ? option.RanderFont : "32px Microsoft YaHei";
	this.LrcDom = typeof option.LrcDom!="undefined" ? option.LrcDom : undefined;
	this.oLRC = {
	    ti: "", //歌曲名
	    ar: "", //演唱者
	    al: "", //专辑名
	    by: "", //歌词制作人
	    offset: 0, //时间补偿值，单位毫秒，用于调整歌词整体位置
	    ms: [] //歌词数组{t:时间,c:歌词}
	};
	this.RefreshInterval = typeof option.Reftime != "undefined" ? option.Reftime : 200;
	this.LrcInfo = {
		Len: 0,
		DisplayRow: 0
	}
	this.lrcDomElement = [];
	this.LoadOk = false;
	
	this.MouseWheel = function(l){
		let LrcDomS = document.getElementById(this.LrcDom);
		let x = LrcDomS.style.transform;
		let so = parseFloat(x.substr(11,x.length - 11 - 3));
		let p = l * this.LrcHeight * this.LrcScrollLen;
		let pxs = so + p;
		LrcDomS.style.transform = "translateY(" + pxs + "px)";
		this.LrcScroll = 5;
	}
	
	this.GetTFValue = function(x){
		return parseFloat(x.substr(11,x.length - 11 - 3));
	}
	
	this.timer = setInterval(() => {
		if(this.LoadOk){
			this.RefLrcDisplay();
		}
	}, this.Refresh_interval);
	
	// this.ScrollTimer = setInterval(() => {
	// 	if(this.LoadOk){
	// 		if(this.Debug){ console.log("滚动倒计时",this.LrcScroll) }
	// 		this.LrcScroll = this.LrcScroll - 1;
	// 	}
	// },1000)
	
	this.LrcHeight = 38; 	//词高度
	this.LrcTop = 3;		//当前歌词距顶部距离
	this.LrcScroll = 0;		//滚动计时
	this.LrcScrollLen = 2;	//滚动量
	this.TFP = 0; 			//TransformP
	this.DisY = 0;
	
	//读取歌词
	this.ReadLrc = function(strl){
		this.LoadOk = false;
		console.time('歌词解析');
		this.oLRC = {
			ti: "", //歌曲名
			ar: "", //演唱者
			al: "", //专辑名
			by: "", //歌词制作人
			olrc: true,//是否是单行歌词
			offset: 0, //时间补偿值，单位毫秒，用于调整歌词整体位置
			ms: [] //歌词数组{t:时间,c:歌词}
		};
		let lrc = strl
		
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
			let lpdall = {
				t: [],
				al: []
			}
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
			        let arr = lrcs[i].match(/\[(\d+:.+?)\]/g);//提取时间字段，可能有多个  | 例如: [00:18.50][01:21.92]ok  代表18秒和1分21秒有歌词ok 合并成 [00:18.50]ok [01:21.92]ok
			        let start = 0;
			        for(let k in arr){
			            start += arr[k].length; //计算歌词位置
			        }
			        let content = lrcs[i].substring(start);//获取歌词内容
			        for (let k in arr){
			            let t = arr[k].substring(1, arr[k].length-1);//取[]间的内容
			            let s = t.split(":");//分离:前后文字
			            // this.oLRC.ms.push({//对象{t:时间,c:歌词}加入ms数组
			            //     t: parseFloat((parseFloat(s[0])*60+parseFloat(s[1])).toFixed(3)),
			            //     c: content
			            // });
						lpdall.t.push(parseFloat((parseFloat(s[0])*60+parseFloat(s[1])).toFixed(3)));
						lpdall.al.push(content);
			        }
			    }
			}
			this.oLRC.ms = lpdall;
			//let i = this.oLRC.ms.length;
			
			//处理排序
			// while (i > 0) {
			// 	for (let j = 0; j < i - 1; j++) {
			// 		if (this.oLRC.ms[j].t > this.oLRC.ms[j + 1].t || this.oLRC.ms[j].t == this.oLRC.ms[j + 1].t) {
			// 			let temp_exc = this.oLRC.ms[j];
			// 			this.oLRC.ms[j] = this.oLRC.ms[j + 1];
			// 			this.oLRC.ms[j + 1] = temp_exc;
			// 		}
			// 	}
			// 	i--;
			// }
			
			this.LrcInfo.Len = this.oLRC.ms.t.length;
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
			this.LrcInfo.Len = this.oLRC.ms.t.length;
		}
		console.timeEnd("歌词解析");
		if(this.Debug)console.log(this);
		console.time("创建标签");
		//this.lrcAppend();
		console.timeEnd("创建标签");
		this.LrcInfo.DisplayRow = -1;
		this.LoadOk = true;
	}

	this.lrcAppend = function(){
		let LrcDom = document.getElementById(this.LrcDom);
		this.lrcDomElement = [];
		LrcDom.innerHTML = "";
		for (let index = 0; index < this.LrcInfo.Len; index++) {
			let element1 = document.createElement("div");
			element1.style.textAlign = "center";
			let element2 = document.createElement("span");
			element1.className = "lrcdisplay_style";
			element2.innerText = this.oLRC.ms.al[index];
			element1.appendChild(element2);
			LrcDom.appendChild(element1);
			this.lrcDomElement.push(element1);
		}
		console.log(this.lrcDomElement)
	}

	this.ElementProcess = function(ProcessType,InputText){
		// switch (ProcessType) {
		// 	case value:
				
		// 		break;
		// 	default:
		// 		break;
		// }
	}

	this.measureText = function(fontSize, fontFamily, text) {
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
	
	this.RefLrcDisplay = function(){
		if(!this.AudioEl){
			return 
		}
		let time_s = this.AudioEl.seek() + (this.oLRC.offset / 1000) + (this.GlobalLrcOffset / 1000);
		if(!this.oLRC.olrc){
			if(time_s < this.oLRC.ms.t[0][0]){
				this.LrcInfo.DisplayRow = -1;
			}
		}else{
			if(time_s < this.oLRC.ms.t[0]){
				this.LrcInfo.DisplayRow = -1;
			}
		}
		
		if(!this.oLRC.olrc){
			for (let i = 0; i < this.LrcInfo.Len; i++) {
				if(this.oLRC.ms.t[i][0] < time_s){
					if(i + 1 >= this.LrcInfo.Len){
						if(this.LrcInfo.DisplayRow != i){
							this.LrcInfo.DisplayRow = i;
						}
						continue
					}
					
					if(this.oLRC.ms.t[i + 1][0] > time_s){
						if(this.LrcInfo.DisplayRow != i){
							this.LrcInfo.DisplayRow = i;
						}
					}
				}
			}
		}else{
			for (let i = 0; i < this.LrcInfo.Len; i++) {
				if(this.oLRC.ms.t[i] < time_s){
					if(i + 1 >= this.LrcInfo.Len){
						if(this.LrcInfo.DisplayRow != i){
							this.LrcInfo.DisplayRow = i;
						}
						continue
					}
					
					if(this.oLRC.ms.t[i + 1] > time_s){
						if(this.LrcInfo.DisplayRow != i){
							this.LrcInfo.DisplayRow = i;
						}
					}
				}
			}
		}
		
		let gone = null;
		let current = null;
		let next = null;
		let LrcDomElement = document.getElementById(this.LrcDom);

		if(this.LrcInfo.DisplayRow == -1){
			let LrcDomx = document.getElementById(this.LrcDom).querySelectorAll("div");
			for (let elex of LrcDomx) {
				let ltype = elex.getAttribute("lrctype");
				switch (ltype) {
					case "current":
						current = elex;
						break;
					case "gone":
						gone = elex;
						break;
					case "next":
						next = elex;
						break;
					default:
						elex.removeChild();
						break;
				}
			}
			if(current != null){
				let currentnow = parseInt(current.getAttribute("lrcrow"));
				if(currentnow != this.LrcInfo.DisplayRow){
					current.setAttribute("lrcrow",0);
				}
				if(current.querySelector("span").innerText != this.oLRC.ms.al[0]){
					current.querySelector("span").innerText = this.oLRC.ms.al[0];
				}
				current.style.backgroundSize = "0 100%";
			}else{
				let element1 = document.createElement("div");
				element1.style.textAlign = "center";
				let element2 = document.createElement("span");
				element1.className = "lrcdisplay_style lrc_display_nowrow";
				element2.innerText = this.oLRC.ms.al[0];
				element1.appendChild(element2);
				element1.setAttribute("lrcrow",0);
				element1.setAttribute("lrctype","current");
				element1.style.backgroundSize = "0 100%";
				LrcDomElement.appendChild(element1);
			}
			if(gone != null){
				let gonerow = parseInt(gone.getAttribute("lrcrow"));
				if(gonerow != -1){
					gone.setAttribute("lrcrow",-1);
				}
				if(gone.querySelector("span").innerText != ""){
					gone.querySelector("span").innerText = "";
				}
			}else{
				let element1 = document.createElement("div");
				element1.style.textAlign = "center";
				let element2 = document.createElement("span");
				element1.className = "lrcdisplay_style lrc_display_backrow";
				element2.innerText = "";
				element1.appendChild(element2);
				element1.setAttribute("lrcrow",-1);
				element1.setAttribute("lrctype","gone");
				element1.style.backgroundSize = "0 100%";
				LrcDomElement.appendChild(element1);
			}
			if(next != null){
				if(1 < this.LrcInfo.Len){
					let nextrow = parseInt(gone.getAttribute("lrcrow"));
					if(nextrow != -1){
						next.setAttribute("lrcrow",1);
						next.querySelector("span").innerText = this.oLRC.ms.al[1];
					}
					if(next.querySelector("span").innerText != this.oLRC.ms.al[1]){
						next.querySelector("span").innerText = this.oLRC.ms.al[1];
					}
				}
			}else{
				if(1 < this.LrcInfo.Len){
					if(next == null){
						let element1 = document.createElement("div");
						element1.style.textAlign = "center";
						let element2 = document.createElement("span");
						element1.className = "lrcdisplay_style lrc_display_nextrow";
						element2.innerText = this.oLRC.ms.al[1];
						element1.appendChild(element2);
						element1.setAttribute("lrcrow",1);
						element1.setAttribute("lrctype","next");
						element1.style.backgroundSize = "0 100%";
						LrcDomElement.appendChild(element1);
					}
				}
			}
			return
		}
		
		let LrcDom = document.getElementById(this.LrcDom).querySelectorAll("div");
		let domnow = -1;
		for (let elex of LrcDom) {
			let ltype = elex.getAttribute("lrctype");
			switch (ltype) {
				case "current":
					current = elex;
					break;
				case "gone":
					gone = elex;
					break;
				case "next":
					next = elex;
					break;
				default:
					elex.removeChild();
					break;
			}
		}
		if(current != null){
			domnow = parseInt(current.getAttribute("lrcrow"));
			if(domnow != this.LrcInfo.DisplayRow){
				if(next != null){
					next.setAttribute("lrctype","current");
					next.setAttribute("lrcrow",this.LrcInfo.DisplayRow);
					next.classList.add("lrc_display_nowrow");
					next.classList.remove("lrc_display_nextrow");
					next.classList.remove("lrc_display_backrow");
					current.setAttribute("lrctype","gone");
					current.setAttribute("lrcrow",this.LrcInfo.DisplayRow - 1);
					current.classList.add("lrc_display_backrow");
					if(gone != null){
						gone.remove();
					}
					current.classList.remove("lrc_display_nowrow");
					current.classList.remove("lrc_display_nextrow");
					current.style.backgroundSize = "0 100%";
				}
			}
		}else{
			let element1 = document.createElement("div");
			element1.style.textAlign = "center";
			let element2 = document.createElement("span");
			element1.className = "lrcdisplay_style lrc_display_nowrow";
			element2.innerText = this.oLRC.ms.al[this.LrcInfo.DisplayRow];
			element1.appendChild(element2);
			element1.setAttribute("lrcrow",this.LrcInfo.DisplayRow);
			element1.setAttribute("lrctype","current");
			element1.style.backgroundSize = "0 100%";
			LrcDomElement.appendChild(element1);
			current = element1;
			domnow = this.LrcInfo.DisplayRow;
		}
		LrcDom = document.getElementById(this.LrcDom).querySelectorAll("div");
		for (let elex of LrcDom) {
			let ltype = elex.getAttribute("lrctype");
			switch (ltype) {
				case "current":
					current = elex;
					break;
				case "gone":
					gone = elex;
					break;
				case "next":
					next = elex;
					break;
				default:
					elex.removeChild();
					break;
			}
		}
		if(domnow > 0){
			if(gone != null){
				let gonerow = parseInt(gone.getAttribute("lrcrow"));
				if(gonerow != this.LrcInfo.DisplayRow - 1){
					gone.remove();
				}
			}else{
				let element1 = document.createElement("div");
				element1.style.textAlign = "center";
				let element2 = document.createElement("span");
				element1.className = "lrcdisplay_style lrc_display_backrow";
				element2.innerText = this.oLRC.ms.al[this.LrcInfo.DisplayRow];
				element1.appendChild(element2);
				element1.setAttribute("lrcrow",this.LrcInfo.DisplayRow - 1);
				element1.setAttribute("lrctype","gone");
				element1.style.backgroundSize = "0 100%";
				LrcDomElement.appendChild(element1);
			}
		}
		if(domnow + 1 < this.LrcInfo.Len){
			if(next == null){
				let element1 = document.createElement("div");
				element1.style.textAlign = "center";
				let element2 = document.createElement("span");
				element1.className = "lrcdisplay_style lrc_display_nextrow";
				element2.innerText = this.oLRC.ms.al[this.LrcInfo.DisplayRow + 1];
				element1.appendChild(element2);
				element1.setAttribute("lrcrow",this.LrcInfo.DisplayRow + 1);
				element1.setAttribute("lrctype","next");
				element1.style.backgroundSize = "0 100%";
				LrcDomElement.appendChild(element1);
			}
		}
		LrcDom = document.getElementById(this.LrcDom).querySelectorAll("div");
		for (let elex of LrcDom) {
			let ltype = elex.getAttribute("lrctype");
			switch (ltype) {
				case "current":
					current = elex;
					break;
				case "gone":
					gone = elex;
					break;
				case "next":
					next = elex;
					break;
				default:
					elex.removeChild();
					break;
			}
		}
		if(!this.oLRC.olrc){
			let a = this.LrcInfo.DisplayRow;
			let p = -1;
			let per = -1;
			let lens = this.oLRC.ms.t[a].length;
			for(let g=0;g<lens;g++){
				if(this.oLRC.ms.t[a][g] < time_s){
					p = g;
				}
			}
			if((p + 1) < lens){ //判断是否到最后一个字
				let x = 1 / lens;
				let pxer = p * x;

				let ggp = this.oLRC.ms.t[a][p+1] - this.oLRC.ms.t[a][p];
				let ggp2 = this.oLRC.ms.t[a][p] - time_s;
				pxer = pxer + (x - ((ggp2 / ggp) * x));
				per = pxer;
			}else{
				per = 1;
			}
			current.style.backgroundSize = "" + (100 * per) + "% 100%";
		}else{
			current.style.backgroundSize = "100% 100%";
		}
		LrcDom = document.getElementById(this.LrcDom).querySelectorAll("div");
		for (let elex of LrcDom) {
			let rowy = parseInt(elex.getAttribute("lrcrow"));
			if(elex.querySelector("span").innerText != this.oLRC.ms.al[rowy] && rowy > -1 && rowy < this.LrcInfo.Len){
				elex.querySelector("span").innerText = this.oLRC.ms.al[rowy];
			}
		}
	}
}