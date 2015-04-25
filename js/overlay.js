/* 显示遮罩层 */
function showOverlay() {    
$("#overlay").height(pageHeight());    
$("#overlay").width(pageWidth());    
// fadeTo第一个参数为速度，第二个为透明度    
// 多重方式控制透明度，保证兼容性，但也带来修改麻烦的问题    
$("#overlay").fadeTo(200, 0.5);
}
/* 隐藏覆盖层 */
function hideOverlay() { 
   $("#overlay").fadeOut(200);
}
function showDialog(id){
	$("#"+id).show();
}
function hideDialog(id){
$("#"+id).hide();
}
/* 当前页面高度 */
function pageHeight() {  
  return document.body.scrollHeight;
 }/* 当前页面宽度 */
function pageWidth() {
	  return document.body.scrollWidth;
}
/*提示框*/
var prox;
var proy;
var proxc;
var proyc;
function showtip(id,info_id){/*--打开--*/
	clearInterval(prox);
	clearInterval(proy);
	clearInterval(proxc);
	clearInterval(proyc);
	var o = document.getElementById(id);
	var f=$('#'+info_id);
	var new_width=f.css("font-size").replace('px','')*(f.text().length+2);
	var h=o.style.height;
	o.style.display = "block";
	o.style.width = "1px";
	o.style.height = "1px"; 
	prox = setInterval(function(){openx(o,new_width)},10);
}	
function openx(o,x){/*--打开x--*/
	var cx = parseInt(o.style.width);
	if(cx < x)
	{
		o.style.width = (cx + Math.ceil((x-cx)/5)) +"px";
	}
	else
	{
		clearInterval(prox);
		proy = setInterval(function(){openy(o,40)},10);
	}
}	
function openy(o,y){/*--打开y--*/	
	var cy = parseInt(o.style.height);
	if(cy < y)
	{
		o.style.height = (cy + Math.ceil((y-cy)/5)) +"px";
	}
	else
	{
		clearInterval(proy);			
	}
}	
function closetip(id){/*--关闭--*/
	clearInterval(prox);
	clearInterval(proy);
	clearInterval(proxc);
	clearInterval(proyc);		
	var o = document.getElementById(id);
	if(o.style.display == "block")
	{
		proyc = setInterval(function(){closey(o)},10);			
	}		
}	
function closey(o){/*--打开y--*/	
	var cy = parseInt(o.style.height);
	if(cy > 0)
	{
		o.style.height = (cy - Math.ceil(cy/5)) +"px";
	}
	else
	{
		clearInterval(proyc);				
		proxc = setInterval(function(){closex(o)},10);
	}
}	
function closex(o){/*--打开x--*/
	var cx = parseInt(o.style.width);
	if(cx > 0)
	{
		o.style.width = (cx - Math.ceil(cx/5)) +"px";
	}
	else
	{
		clearInterval(proxc);
		o.style.display = "none";
	}
}	

/* 定位到页面中心 */
function adjust(id) {
    var w = $(id).width();
    var h = $(id).height();
	var t = scrollY() + (windowHeight()/2) - (h/2);    if(t < 0) t = 0;
	var l = scrollX() + (windowWidth()/2) - (w/2);    if(l < 0) l = 0;
	$(id).css({left: l+'px', top: t+'px'});
	}//浏览器视口的高度
function windowHeight() {    
	var de = document.documentElement;
    return self.innerHeight || (de && de.clientHeight) || document.body.clientHeight;
	}//浏览器视口的宽度
function windowWidth() {
	var de = document.documentElement;
	return self.innerWidth || (de && de.clientWidth) || document.body.clientWidth
	}
		/* 浏览器垂直滚动位置 */
function scrollY() {
	var de = document.documentElement;
	return self.pageYOffset || (de && de.scrollTop) || document.body.scrollTop;
	}/* 浏览器水平滚动位置 */
function scrollX() {
	var de = document.documentElement;
	return self.pageXOffset || (de && de.scrollLeft) || document.body.scrollLeft;
	}