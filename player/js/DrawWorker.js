let allx = null;	//歌词数组
let tfs = null;		//离屏渲染画布
let uplock = false;	//数组读取锁定
let fonth = 0;		//字体大小
let k = fonth / 2;	//字体一半
let hz = 12;		//行间距
let gdoffset = 0;	//缓动
let onwp = 0;		//当前显示行
let sco = 0;		//滚动量
let scolock = false;//滚动锁定
let con = null;		//画布
let timer = null;	//滚动倒计时
let pos = 0;		//滚动锁定时位置
let xxslock = false;//强制刷新锁 true即刷新一次
let tfs_h = null;	//高
let tfs_w = null;	//宽
let olrc = true;	//单行还是渐进式歌词
let fontname = 'Microsoft YaHei' //字体名称
let fontheigth = 0;

self.onmessage = function(e) {
	switch(e.data.commends){
		case "ReadLrc":
			uplock = true;
			allx = null;
			allx = e.data.all;
			con = tfs.getContext("2d");
			con.font = fonth + "px " + fontname;
			let o = 0;
			for (let va in allx) {
				allx[va].width = con.measureText(allx[va].c).width;
				o += fonth + hz;
				allx[va].offset = o;
			}
			uplock = false;
			xxslock = true;
			console.log(allx);
		break;
		case "OffScreenSet":
			tfs = e.data.canvas;
			con = tfs.getContext("2d")
			tfs_h = tfs.height;
			tfs_w = tfs.width;
			break;
		case "ref":
			let nowa = allx[e.data.now]
			let per = typeof e.data.per != "undefined" ? e.data.per : -1;
			if(allx != null && !uplock && con != null){
				let h2 = (tfs_h / 2);
				if(!scolock){
					pos = nowa.offset;
				}else{
					pos += sco;
					if(pos < h2){
						pos = h2
					}
					sco = 0;
				}
				
				if((onwp != e.data.now && gdoffset < 1 && !scolock) || per != -1){
					onwp = e.data.now;
					gdoffset = fonth + hz;
				}
				
				if(gdoffset < 2){
					gdoffset = 0;
					if(xxslock){
						xxslock = false;
					}else{
						if(!scolock){
							break;
						}
					}
				}
				con.clearRect(0, 0, tfs_w, tfs_h);
				tfs.width = tfs.width;
				con.save();
				
				con.font = fonth + "px " + fontname;
				con.fillStyle = "coral";
				con.textAlign = "center";
				//con.shadowOffsetX = 1;
				//con.shadowOffsetY = 1;
				//con.shadowBlur = 1;
				//con.shadowColor = "rgba(0, 0, 0, 0.25)";
				//con.textBaseline = "middle";
				//con.fillText(nowa.c, (tfs.width / 2), (tfs.height / 2));
				//con.restore();
				let l = fonth + hz + gdoffset;
				if(uplock){
					break
				}
				if(typeof allx[onwp] == "undefined"){
					break
				}
				if(allx[onwp].offset < h2 && !scolock){
					l += h2 - nowa.offset - (fonth + hz);
				}else{
					l -= (fonth + hz) * 2
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
						if(va == e.data.now){
							con.fillStyle = "#B8B8B8";
							con.fillText(p.c, (tfs.width / 2), l);
							con.save();
							
							if(per != -1){
								con.save();
								con.beginPath();
								//裁剪没有播放到的位置
								con.rect((tfs.width / 2) - (p.width / 2), l - fontheigth.height + 8, p.width * per, fontheigth.height);
								//console.log((tfs.width / 2) - (p.width / 2), l - fontheigth.height + 8, p.width * per, fontheigth.height)
								con.fill();
								
								con.font = fonth + "px " + fontname;
								con.fillStyle = "coral";
								con.textAlign = "center";
								
								con.fillStyle = "#ce0003";
								con.fillText(p.c, (tfs.width / 2), l);
								
								con.save();
								//con.restore();
								
								con.globalCompositeOperation = "source-over";
								con.font = fonth + "px " + fontname;
								con.fillStyle = "coral";
								con.textAlign = "center";
								con.save();
								con.beginPath();
							}else{
								con.fillStyle = "#000000";
								con.fillText(p.c, (tfs.width / 2), l);
								con.save();
							}
						}else{
							con.fillStyle = "#B8B8B8";
							con.fillText(p.c, (tfs.width / 2), l);
							con.save();
						}
						con.save();
					}
				}
				if(gdoffset > 0 && !scolock){
					gdoffset = gdoffset - (gdoffset / 8);
				}
				
				con.save();
				
				//锁定
				if(scolock){
					con.fillStyle = "#FFFFFF";
					con.beginPath();
					con.moveTo(0, h2 + 2);
					con.lineTo(tfs_w, h2 + 2);
					con.stroke();
				}
				
				//上下渐变
				con.beginPath();
				con.globalCompositeOperation = "destination-out";
				
				let t = con.createLinearGradient(0, 0, 0, 64)
				t.addColorStop(0, "rgba(255,255,255,1)");
				t.addColorStop(1, "rgba(255,255,255,0)");
				
				con.fillStyle = t;
				con.fillRect(0, 0, tfs.width, 64);
				
				con.save();
				
				con.beginPath();
				let t2 = con.createLinearGradient(0, tfs.height - 64, 0,tfs.height)
				t2.addColorStop(0, "rgba(255,255,255,0)");
				t2.addColorStop(1, "rgba(255,255,255,1)");
				
				con.fillStyle = t2;
				con.fillRect(0, tfs.height - 64, tfs.width, 64);
				
				con.save();
			}
			
			break;
		case "FontSizeSet":
			fonth = e.data.size;
			k = fonth / 2;
			fontname = e.data.font
			fontheigth = e.data.heig
			break;
		case "MouseWheel":
			sco += e.data.f;
			//console.log(sco)
			gdoffset = 0;
			if(!timer){
				//console.log("加锁")
				scolock = true;
				clearTimeout(timer)
				timer = setTimeout(() => {
					timer = null;
					scolock = false;
					console.log("解锁")
					gdoffset = 0;
					xxslock = true;
				},3000);
			}else{
				//console.log("加锁2")
				scolock = true;
				clearTimeout(timer)
				timer = setTimeout(() => {
					timer = null;
					scolock = false;
					console.log("解锁")
					gdoffset = 0;
					xxslock = true;
				},3000);
			}
			break;
		default:
		break;
	}
}