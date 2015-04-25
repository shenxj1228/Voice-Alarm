var myDB = chrome.extension.getBackgroundPage().myDB;
var storeName = chrome.extension.getBackgroundPage().storeName;
var weekarry = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
var valChecked = '';
var cunt = 0;

$(document).ready(function () {
	var id = $.getUrlParam('xh');
	if (id != -1) {
		var transaction = myDB.db.transaction(storeName, 'readwrite');
		var store = transaction.objectStore(storeName);
		var request = store.get(id);
		request.onsuccess = function (e) {
			var value = e.target.result;
			if (value.timefrequencys.split(',').length > 0) {
				var arrytimeFrequency = value.timefrequencys.split(',');
				for (var i = 0; i < arrytimeFrequency.length; i++) {
					valChecked += weekarry[parseInt(arrytimeFrequency[i],10)] + ' ';
					$("option[value=" + arrytimeFrequency[i] + "]").attr('selected', true);
				}
				if (arrytimeFrequency.length == 7) {
					valChecked = "每天";
				}
			}
			$("#inputHour").attr('value', value.hour);
			$("#inputMinute").attr('value', value.minute);
			$("#inputTitle").attr('value', value.title);
			$("#inputContent").attr('value', value.content);
			$("#inputUrl").attr('value', value.url);
			if (JSON.parse(value.state)) {
				$("#used").attr('checked', true);
			} else {
				$(".labelBox").css('background', '#bbbbbb');
			}
			$("#inputHour").parent().addClass('input--filled');
			$("#inputMinute").parent().addClass('input--filled');
			$("#inputTitle").parent().addClass('input--filled');
			if (value.content != '') {
				$("#inputContent").parent().addClass('input--filled');
			}
			if (value.url != '') {
				$("#inputUrl").parent().addClass('input--filled');
			}
			checksel();
		};

	} else {
		checksel();
	}

	cunt++;
	text_checkbox_read();
	btn_read();
});

function checksel() {
	$("#sel").multiselect({
		show : ["bounce", 200],
		hide : ["explode", 1000],
		minWidth : 280,
		selectedText : function (numChecked, numTotal, checkedItems) {
			if (cunt != 0) {
				valChecked = "";
				if (numChecked == 0) {
					valChecked = '永不';
				} else if (numChecked == numTotal) {
					valChecked = '每天';
				} else {
					for (var i = 0; i < checkedItems.length; i++) {
						valChecked += weekarry[checkedItems[i].value] + ' ';
					}
				}
			}
			return valChecked;
		},
		checkAllText : '全选',
		uncheckAllText : '全不选',
		noneSelectedText : '一次'
	});
}

//获取参数
(function ($) {
	$.getUrlParam = function (name) {
		var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
		var r = window.location.search.substr(1).match(reg);
		if (r != null)
			return unescape(r[2]);
		return null;
	};
})(jQuery);

function text_checkbox_read() {
	var xh = $.getUrlParam('xh');
	//text绑定样式
	$("input[type='text']").each(function () {
		$(this).off('focus').on('focus', function () {
			if (!$(this).parent().hasClass('input--filled')) {
				$(this).parent().addClass('input--filled');
			}
		});
		$(this).off('blur').on('blur', function () {
			if ($.trim($(this).val()) == '') {
				$(this).parent().removeClass('input--filled');
			}
		});
	});

	//时间控制输入格式
	$("#inputHour").keyup(function () {
		$(this).val($(this).val().replace(/[^0-9]\D*$/, "") % 24);
		$(this).val($(this).val() < 10 ? '0' + $(this).val() : $(this).val());
	});
	$("#inputHour").on('paste', function () {
		return !clipboardData.getData('text').match(/\D/);
	});
	$("#inputMinute").keyup(function () {
		$(this).val($(this).val().replace(/[^0-9]\D*$/, "") % 60);
		$(this).val($(this).val() < 10 ? '0' + $(this).val() : $(this).val());
	});
	$("#inputMinute").on('paste', function () {
		return !clipboardData.getData('text').match(/\D/);
	});

	//checkbox 加载、改变样式
	if (xh == '-1') {
		$("#used").attr('checked', true);
	}

	$("#used").off('change').on('change', function () {
		if ($("#used").is(':checked')) {
			$(this).parent().css('background', '#26ca28');
		} else {
			$(this).parent().css('background', '#bbbbbb');
		}
	});
}

function getTimeFrequency() {
	if ($("select option:selected").length == 0) {
		return '-1';
	} else {
		var arry_timeFrequency = [];
		$("select option:selected").each(function () {
			arry_timeFrequency.push($(this).attr('value'));
		});
		return arry_timeFrequency.join(',');
	}

}

function saveData() {
	var info = "";
	var xh = $.getUrlParam('xh');
	if ($.trim($("#inputHour").val()) == "") {
		info = "小时不能为空！";
	}
	if ($.trim($("#inputMinute").val()) == "") {
		info += "分钟不能为空！";
	}
	if ($.trim($("#inputTitle").val()) == "") {
		info += "标题不能为空！";
	}
	if ($.trim($("#inputUrl").val()).substr(0, 4).toUpperCase() != 'HTTP' && $.trim($("#inputUrl").val()) != '') {
		info += "链接必须以http或https开头";
	}
	if (info != "") {
		$("#tipinfo").text(info);
		showtip('tip', 'tipinfo');
		setTimeout(function () {
			closetip('tip');
		}, 3000);
		$("#inputHour").parent().addClass('input--filled');
		$("#inputMinute").parent().addClass('input--filled');
		$("#inputTitle").parent().addClass('input--filled');
		return false;
	} else {
		var reminds = [{
				id : chrome.extension.getBackgroundPage().guid(),
				state : $("#used").is(':checked') ? true : false,
				hour : $("#inputHour").val(),
				minute : $("#inputMinute").val(),
				title : $("#inputTitle").val(),
				content : $("#inputContent").val(),
				url : $("#inputUrl").val(),
				timefrequencys : getTimeFrequency()
			}
		];
		if (xh == '-1') {
			chrome.extension.getBackgroundPage().addData(myDB.db, storeName, reminds);
		} else {
			id = xh;
			var transaction = myDB.db.transaction(storeName, 'readwrite');
			var store = transaction.objectStore(storeName);
			var request = store.get(id);
			request.onsuccess = function (e) {
				var remindinfo = e.target.result;
				remindinfo.state = $("#used").is(':checked') ? true : false;
				remindinfo.hour = $("#inputHour").val();
				remindinfo.minute = $("#inputMinute").val();
				remindinfo.title = $("#inputTitle").val();
				remindinfo.content = $("#inputContent").val();
				remindinfo.url = $("#inputUrl").val(),
				remindinfo.timefrequencys = getTimeFrequency();
				store.put(remindinfo);
			};
		}
		return true;
	}
}

function btn_read() {
	$("#ok").off().on('click', function () {
		if (saveData()) {
			chrome.extension.getBackgroundPage().reloadOptionHtml('/options.html');
			chrome.extension.getBackgroundPage().remind();
			$("#ok").off();
			setTimeout(function () {
				window.close();
			}, 300);
		}
	});
}
