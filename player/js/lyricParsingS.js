function lyricParsingS(option){
	this.Ver = "SS 0.0.1";
	this.Debug = typeof option.Debug!="undefined" && typeof option.Debug=="boolean" ? option.Debug : false;
	this.GlobalLrcOffset = typeof option.offset!="undefined" && typeof option.offset=="number" ? option.offset : 0;
	this.RanderFont = typeof option.RanderFont!="undefined" && typeof option.RanderFont=="string" ? option.RanderFont : "32px Microsoft YaHei";
	this.LrcDom = typeof option.LrcDom!="undefined" ? option.LrcDom : undefined;
	this.RefEvent = typeof option.RefEvent!="undefined" ? option.RefEvent : undefined;
	
	this.oLRC = {
	    ti: "", //歌曲名
	    ar: "", //演唱者
	    al: "", //专辑名
	    by: "", //歌词制作人
	    offset: 0, //时间补偿值，单位毫秒，用于调整歌词整体位置
	    ms: [] //歌词数组{t:时间,c:歌词}
	};
	this.Lastlist = [];
	this.LrcInfo = {
		Len: 0,
		DisplayRow: 0
	}
	this.LoadOk = false;
	this.ClassicKaraoke = false;

	this.LastTime = 6;
	this.LastTimePer = "1";
	
	this.LrcTop = true;
	
	//读取歌词
	this.ReadLrc = function(InOLRC,Lastlist){
		this.LoadOk = false;
		console.time('歌词解析');
		this.Lastlist = Lastlist;
		this.oLRC = InOLRC;
		this.LrcInfo.Len = this.oLRC.ms.t.length;
		console.timeEnd("歌词解析");

		console.time("创建标签");
		this.LrcInfo.DisplayRow = -1;
		document.getElementById(this.LrcDom).innerHTML = "";
		this.LrcTop = true;
		if(this.ClassicKaraoke){
			let LrcDomElement = document.getElementById(this.LrcDom);
			for (let idx = 0; idx < 3; idx++) {
				let element1 = document.createElement("div");
				element1.style.textAlign = "center";
				let element2 = document.createElement("span");
				let stc = "";
				switch (idx) {
					case 0:
						stc = "lrc_classic_display_countrow";
						element1.setAttribute("lrctype","count");
						break;
					case 1:
						stc = "lrc_classic_display_nowrow";
						element1.setAttribute("lrcrow",-1);
						element1.setAttribute("lrctype","one");
						element1.style.backgroundSize = "0 100%";
						break;
					case 2:
						stc = "lrc_classic_display_nextrow";
						element1.setAttribute("lrcrow",-1);
						element1.setAttribute("lrctype","two");
						element1.style.backgroundSize = "0 100%";
						break;
					default:
						break;
				}
				element1.className = "lrcdisplay_classic_style " + stc;
				element2.innerText = "";
				element1.appendChild(element2);
				LrcDomElement.appendChild(element1);
			}
		}
		if(this.oLRC.olrc){
			let next = 0;
			for (let index = 0; index < this.LrcInfo.Len; index++) {
				let p = this.oLRC.ms.t[index];
				this.Lastlist.push((p - next).toFixed(2));
				next = p;
			}
		}else{
			let next = 0;
			for (let index = 0; index < this.LrcInfo.Len; index++) {
				let p = this.oLRC.ms.t[index][0];
				this.Lastlist.push((p - next).toFixed(2));
				next = this.oLRC.ms.t[index][this.oLRC.ms.t[index].length - 1];
			}
		}
        console.timeEnd("创建标签");
		console.log(this.Lastlist,this.oLRC);
		this.LoadOk = true;
	}
	
	this.RefLrcDisplay = function(seek){
        if(!this.LoadOk){
            return
        }
		if(this.RefEvent!=undefined){
			this.RefEvent();
		}
		let time_s = seek;
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

		if(this.LrcInfo.DisplayRow + 1 < this.LrcInfo.Len){
			let next = 0;
			let nowt = 0;
			if(this.oLRC.olrc){
				next = this.oLRC.ms.t[this.LrcInfo.DisplayRow + 1];
				nowt = this.oLRC.ms.t[this.LrcInfo.DisplayRow];
			}else{
				next = this.oLRC.ms.t[this.LrcInfo.DisplayRow + 1][0];
				if(this.LrcInfo.DisplayRow > -1){
					let ow = this.oLRC.ms.t[this.LrcInfo.DisplayRow];
					if(typeof ow == "object" && ow.length > 2){
						nowt = this.oLRC.ms.t[this.LrcInfo.DisplayRow][ow.length - 1];
					}else{
						nowt = this.oLRC.ms.t[this.LrcInfo.DisplayRow][0];
					}
				}else{
					nowt = this.oLRC.ms.t[0][0];
				}
			}
			let p = this.Lastlist[this.LrcInfo.DisplayRow + 1];
			let o = (next - time_s + 1).toFixed(0);
			if(this.LastTimePer == ".1"){
				o = (next - time_s).toFixed(1);
			}else if(this.LastTimePer == ".01"){
				o = (next - time_s).toFixed(2);
			}
			let morex = (next - time_s).toFixed(2);
			if(this.LrcInfo.DisplayRow == -1 && next - time_s < this.LastTime && next > this.LastTime){
				document.getElementById("lasttimeprocess").style.height = "0.5rem";
				document.getElementById("lasttime").style.display = "block";
				document.getElementById("lasttime").innerText = o + " s";
				document.getElementById("lasttimeprocess").style.width = ((morex / this.LastTime) * 100)+ "%";
			}else if(next - time_s < this.LastTime && p > this.LastTime && next - nowt > this.LastTime){
				document.getElementById("lasttimeprocess").style.height = "0.5rem";
				document.getElementById("lasttime").style.display = "block";
				document.getElementById("lasttime").innerText = o + " s";
				document.getElementById("lasttimeprocess").style.width = ((morex / this.LastTime) * 100)+ "%";
			}else{
				document.getElementById("lasttimeprocess").style.height = "0rem";
				document.getElementById("lasttime").style.display = "none";
				document.getElementById("lasttimeprocess").style.width = "0%";
			}
		}else{
			document.getElementById("lasttimeprocess").style.height = "0rem";
			document.getElementById("lasttime").style.display = "none";
			document.getElementById("lasttimeprocess").style.width = "0%";
		}
		
		let gone = null;
		let current = null;
		let next = null;
		let LrcDomElement = document.getElementById(this.LrcDom);
		if(this.ClassicKaraoke){
			let LrcDomx = document.getElementById(this.LrcDom).querySelectorAll("div");
			for (let elex of LrcDomx) {
				let ltype = elex.getAttribute("lrctype");
				switch (ltype) {
					case "one":
						current = elex;
						break;
					case "count":
						gone = elex;
						break;
					case "two":
						next = elex;
						break;
					default:
						elex.remove();
						break;
				}
			}
			if(this.LrcInfo.DisplayRow == -1){
				this.LrcTop = true
				if(!this.LrcTop){
					if(1 > this.LrcInfo.Len){
						current.querySelector("span").innerText= "";
						current.setAttribute("lrcrow",-1);
					}else{
						current.querySelector("span").innerText = this.oLRC.ms.al[1];
						current.setAttribute("lrcrow",-1);
					}
					
					next.querySelector("span").innerText = this.oLRC.ms.al[0];
					next.setAttribute("lrcrow",-1);
				}else{
					if(1 > this.LrcInfo.Len - 1){
						next.querySelector("span").innerText = "";
						next.setAttribute("lrcrow",-1);
					}else{
						next.querySelector("span").innerText = this.oLRC.ms.al[1];
						next.setAttribute("lrcrow",-1);
					}
					
					current.querySelector("span").innerText = this.oLRC.ms.al[0];
					current.setAttribute("lrcrow",-1);
				}
				return
			}
			let nowline = -1;
			if(!this.LrcTop){
				nowline = parseInt(current.getAttribute("lrcrow"));
			}else{
				nowline = parseInt(next.getAttribute("lrcrow"));
			}
			if(nowline != this.LrcInfo.DisplayRow){
				this.LrcTop = !this.LrcTop;

				if(this.LrcTop){
					current.classList.remove("lrc_classic_display_nowrow");
					current.classList.add("lrc_classic_display_nextrow");
					
					next.classList.remove("lrc_classic_display_nextrow");
					next.classList.add("lrc_classic_display_nowrow");

					if(this.LrcInfo.DisplayRow + 1 > this.LrcInfo.Len){
						current.querySelector("span").innerText= "";
						current.setAttribute("lrcrow",-1);
					}else{
						if(this.LrcInfo.DisplayRow + 1 < this.oLRC.ms.al.length){
							current.querySelector("span").innerText = this.oLRC.ms.al[this.LrcInfo.DisplayRow + 1];
						}else{
							current.querySelector("span").innerText = "";
						}
						current.setAttribute("lrcrow",this.LrcInfo.DisplayRow + 1);
					}
					
					next.querySelector("span").innerText = this.oLRC.ms.al[this.LrcInfo.DisplayRow];
					next.setAttribute("lrcrow",this.LrcInfo.DisplayRow);
				}else{
					next.classList.remove("lrc_classic_display_nowrow");
					next.classList.add("lrc_classic_display_nextrow");

					current.classList.remove("lrc_classic_display_nextrow");
					current.classList.add("lrc_classic_display_nowrow");

					if(this.LrcInfo.DisplayRow + 1 > this.LrcInfo.Len - 1){
						next.querySelector("span").innerText = "";
						next.setAttribute("lrcrow",-1);
					}else{
						if(this.LrcInfo.DisplayRow + 1 < this.oLRC.ms.al.length){
							next.querySelector("span").innerText = this.oLRC.ms.al[this.LrcInfo.DisplayRow + 1];
						}else{
							next.querySelector("span").innerText = "";
						}
						next.setAttribute("lrcrow",this.LrcInfo.DisplayRow + 1);
					}
					
					current.querySelector("span").innerText = this.oLRC.ms.al[this.LrcInfo.DisplayRow];
					current.setAttribute("lrcrow",this.LrcInfo.DisplayRow);
				}
			}
			if(this.LrcInfo.DisplayRow == -1){
				return
			}
			let px = "";
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
				px = "" + (100 * per) + "% 100%";
			}else{
				px = "100% 100%";
			}
			if(!this.LrcTop){
				current.style.backgroundSize = px;
				next.style.backgroundSize = "0 100%";
			}else{
				next.style.backgroundSize = px;
				current.style.backgroundSize = "0 100%";
			}
			return
		}

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
						elex.remove();
						break;
				}
			}
			if(gone != null){
				let gonerow = parseInt(gone.getAttribute("lrcrow"));
				if(gonerow != -1){
					gone.setAttribute("lrcrow",-1);
				}
				if(gone.querySelector("span").innerHTML != "&nbsp;"){
					gone.querySelector("span").innerHTML = "&nbsp;";
				}
			}else{
				let element1 = document.createElement("div");
				element1.style.textAlign = "center";
				let element2 = document.createElement("span");
				element1.className = "lrcdisplay_style lrc_display_backrow";
				element2.innerHTML = "&nbsp;";
				element1.appendChild(element2);
				element1.setAttribute("lrcrow",-1);
				element1.setAttribute("lrctype","gone");
				element1.style.backgroundSize = "0 100%";
				LrcDomElement.appendChild(element1);
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
					elex.remove();
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
					next = element1;

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
					elex.remove();
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
					elex.remove();
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