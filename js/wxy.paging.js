/**
 * ! 分页加载，滑动加载（模板加载）
 *
 * @author hao.wang 2014-10-20 support sea.js
 */
(function(factory) {
	if (typeof define === 'function') {
		define("wxy.paging", [], factory);
	} else {
		factory();
	}
})(function(require) {
	if (require) {
		var $ = require("jquery");
	} else {
		var $ = window.jQuery || window.Zepto;
	}

	// 插件描述
	var pluginName = "paging";

	// 插件默认配置
	var DEFAULTS = {
		ajax : {
			url : "",
			dataType : "JSON",
			cache : false,
			data : {
				page : 1
			},
			type : "get"
		},
		handler : {
			nextPage : "#nextPage",
			status : "#status",
			holder : "",
			showNoContent : true,
			showAllLoaded : true,
			autoLoad : false,
			triggerByScroll : false,// 是否滑动加载
			isScrollByBottom : true,// 是否滑动到底部加载
			disToTrigger : 30,// 滑动模式下，当距离底部或者顶部多少像素时触发加载
			scroller : window,// 监听滑动事件的dom
			scrollHolder : "body"// 滑动模式下
			// 可以计算滑动距离的滑动内容（this.scrollTop，$this.innerHeight,最好是body，为空的时候为当前插件$root）的dom
		},
		dataParser : {
			pageSize : 10,
			reverse : false,
			isAppend : true,
			nameData : "data",
			nameArray : "items",
			isSuccess : function(json) {
				return json.status == 0;
			},
			getMessage : function(json) {
				return json.message;
			},
			getPageTotal : function(json) {
				return json.pageTotal;
			},
			getItemTotal : function(json) {
				return json.itemTotal;
			},
			getDataArray : function(json) {
				var data = json[this.nameData];
				if (data) {
					var array = data[this.nameArray];
					if ($.isArray(array)) {
						return array;
					}
					console.log(data, ' has no child array named ',
							this.nameArray);
				} else {
					console.log(json, ' has no child obj named ',
							this.nameData);
				}
				return null;
			}
		},
		dataRender : {
			tmplSelector : "#template",
			createPageHolder : function() {
				return $("<div>");
			},
			createItemHolder : function() {
				return $("<div>");
			},
			renderItem : function(item) {
				var $tmpl = $(this.tmplSelector);
				// debuglog("$tmpl:", $tmpl, item);
				if ($tmpl.render) {
					return $tmpl.render(item);
				} else {
					console.error("there is no render plugin!");
				}
				return "";
			},
			animation : "show"
		},
		msgs : {
			scrollLoad : "上拉加载更多",
			error : "加载出错",
			loading : "正在加载",
			allLoaded : "已加载所有内容,共%s条",
			noContent : "暂无内容",
			unknown : "未知",
			ajaxError : "网络异常",
			dataError : "数据格式出错",
			renderError : "数据解析失败"
		},
		pageLoadBefore : function(dataArray, page, total) {// this
			// $pageHodler
		},
		pageLoaded : function(dataArray, page, total) {// this
			// $pageHodler
		},
		itemLoaded : function(item, count, total) {// this $itemHodler
		},
		statusChanged : function(statusTo, statusFrom, msg) {// this
			// $el
		},
		showWarn : function(msg) {
		}
	};

	// 插件api方法
	var API_METHODS = ["clear", "load", "reload", "disabledScroll",
		"enableScroll"];// 不返回具体值
	var API_RT_VAL_METHODS = [];// 返回具体值

	// 插件class
	var Plugin = function($el, options) {
		this._$el = $el;
		options = $.extend(true, {}, DEFAULTS, options || {});
		this._options = options;
		this._page = options.ajax.data.page || 1;
		this._pageCount = 0;
		this._startPage = options.ajax.data.page;
		this._status = STATUS.normal;
		this._itemCount = 0;

		this._$nextPage = this.find$(options.handler.nextPage, false);
		this._$status = this.find$(options.handler.status, false);

		this._$holder = this.find$(options.handler.holder, true);
		if (this._$holder.length == 0) {
			throw new Error("$holder is empty");
		}
		this.init();

	};

	// 这里编写逻辑功能ptype.func1=...
	var ptype = Plugin.prototype;
	// 清除本插件的效果
	ptype.clear = function() {
		this._$el.data(pluginName, null);
	}
	var debuglog = function() {
		// console.log(arguments);
	}

	// 0可以加载更多，-1加载出错，1加载完了，2正在加载,3暂无内容
	var STATUS = {
		loading : "loading",
		error : "error",
		allLoaded : "allLoaded",
		noContent : "noContent",
		normal : "normal"
	};

	// 依次从$el，document查询dom，找到为止,selector='' 返回插件的根节点
	ptype.find$ = function(selector, defaultRoot) {
		var $el = find$2(this._$el, selector, defaultRoot);
		if ($el.length == 0) {
			// console.warn("not find dom with selector:", selector);
		}
		return $el;
	}

	var find$2 = function($root, selector, defaultRoot) {
		if (typeof selector == "string") {
			if (selector == "") {
				return defaultRoot ? $root : $("<span>");
			} else {
				var $e = $root.find(selector);
				if ($e.length != 0) {
					return $e;
				}
			}
		}
		return $(selector);
	}

	ptype.ajaxPage = function(page) {
		this._page = page;
		this._loaded = true;
		var self = this;
		self.changeStatus(STATUS.loading);

		var ajax = self._options.ajax;
		ajax.data.page = page;
		ajax.success = function(json, status) {
			if (typeof json == "string") {
				json = $.parseJSON(json);
			}
			self.ajaxSuccess(page, json, status);
		};
		ajax.error = function(xrh, ts, et) {
			self.ajaxError(page, xrh, ts, et);
		};
		$.ajax(ajax);
		// debuglog("load page:", page);
	};

	ptype.nextPage = function() {
		var self = this;
		switch (self._status) {
			case STATUS.loading :
				// debuglog("page has been loading");
				return;
			case STATUS.allLoaded :
				// debuglog("all have been Loaded");
				return;
			case STATUS.noContent :
				// debuglog("no content");
				return;
			case STATUS.normal :

		}
		var page = this._page;
		if (this._loaded) {
			page++;
		}
		self.ajaxPage(page);
	};

	// 检验是否scoll dom 到了底部 $scrollHolder
	ptype.isInBottomArea = function(dis) {
		var scrollTop = this._scrollHolder.scrollTop;
		var innerHeight = this._scrollHolder.clientHeight
				|| this._$scrollHolder.innerHeight();
		var scrollHeight = this._scrollHolder.scrollHeight;
		// debuglog("(scrollTop + innerHeight) , (scrollHeight - dis)",
		// (scrollTop + innerHeight), (scrollHeight - dis));
		// debuglog("scrollTop , innerHeight, scrollHeight - dis:",
		// scrollTop, innerHeight, scrollHeight - dis);
		return (scrollTop + innerHeight) >= (scrollHeight - dis);
	}

	// 检验是否scoll dom 到了顶部 this=dom contentHolder
	ptype.isInTopArea = function(dis) {
		// debuglog("this._$scrollHolder[0].scrollTop,dis",
		// this._$scrollHolder[0].scrollTop, dis);
		return this._$scrollHolder[0].scrollTop <= dis;
	}

	var evScroll = "scroll.paging", evClick = "click.paging";

	ptype.init = function() {
		var self = this;
		var options = this._options;

		// 滑动加载
		if (options.handler.triggerByScroll) {
			var disToTrigger = options.handler.disToTrigger || 30;
			var isByBt = options.handler.isScrollByBottom;
			this._$scrollHolder = this.find$(
					options.handler.scrollHolder, true);
			this._scrollHolder = this._$scrollHolder[0];
			self._notArr = true;
			self._$scroller = this
					.find$(options.handler.scroller, true);
			debuglog("scroller:", self._$scroller);
			debuglog("scrollHolder:", this._$scrollHolder);
			// .off(evScroll)
			self._$scroller.on(evScroll, function(event, force) {
				debuglog("scroll.paging");
				if (force || !self._disableScroll) {
					var inTriggerArea = self[isByBt
							? "isInBottomArea"
							: "isInTopArea"](disToTrigger);
					if (self._notArr && inTriggerArea) {
						// debuglog("scroll trigger page
						// load!");
						self.nextPage();
						self._notArr = false;
					} else if (!inTriggerArea) {
						self._notArr = true;
					}
				}
			});
		} else {
			// .off(evClick)
			self._$nextPage.on(evClick, function() {
				self.nextPage();
			});
		}

		if (options.handler.autoLoad) {
			this.load();
		}
	}

	ptype.load = function() {
		this.ajaxPage(this._startPage);
	}

	ptype.reload = function() {
		this.load();
	}

	ptype.ajaxError = function(page, xrh, ts, et) {
		console.error("load page:", page, " error!", ts,
				xrh.responseText);
		this.changeStatus(STATUS.error, this._options.msgs.ajaxError);
	};

	ptype.renderPage = function(dataArray, page, pageTotal, itemTotal) {
		try {
			var self = this;
			var options = this._options;
			var dr = options.dataRender;
			var $ph = dr.createPageHolder().attr("data-page", page);
			var emptyPh = !$ph.length;
			if (emptyPh) {
				$ph = this._$holder;
			}

			dataArray.forEach(function(item, idx) {
				$ph[self.isAppend() ? "append" : "prepend"](self
						.renderItem(item, idx, itemTotal));
			});
			self
					.changeStatus(dataArray.length < options.dataParser.pageSize
							? STATUS.allLoaded
							: STATUS.normal);
			this._pageCount++;
			if (!emptyPh) {
				var animation = options.dataRender.animation;
				if (animation != "") {
					$ph.hide()[$ph[animation] ? animation : "show"]();
				}
			}
			options.pageLoadBefore
					.call($ph, dataArray, page, pageTotal);
			this._$holder[this.isAppend() ? "append" : "prepend"]($ph);
			this.fixScrollByTop();
			this.fixScrollPause();
			options.pageLoaded.call($ph, dataArray, page, pageTotal);
		} catch (e) {
			console.log(e);
			self.changeStatus(STATUS.error, options.msgs.renderError);
		}
		return "";
	};

	ptype.renderItem = function(item, idx, total) {
		var self = this;
		var options = this._options;
		var dr = options.dataRender;
		var $item = dr.createItemHolder().attr("data-item", idx);
		var $render = dr.renderItem(item);
		if ($item.length) {
			$item.append($render);
		} else {
			$item = $render;
		}
		self._itemCount++;
		options.itemLoaded.call($item, item, self._itemCount, total);
		return $item;
	};

	ptype.ajaxSuccess = function(page, json, status) {
		var options = this._options;
		var dp = options.dataParser;
		if (dp.isSuccess(json)) {
			var darray = dp.getDataArray(json);
			var pageTotal = dp.getPageTotal(json);
			var itemTotal = dp.getItemTotal(json);
			if (darray == null) {
				this.changeStatus(STATUS.error, options.msgs.dataError);
			} else if (darray.length < 1) {
				if (this._page == this._startPage) {
					this.changeStatus(STATUS.noContent);
				} else {
					this.changeStatus(STATUS.allLoaded);
				}
			} else {
				if (options.dataParser.reverse) {
					darray.reverse();
				}
				this.renderPage(darray, page, pageTotal, itemTotal);
			}
		} else {
			var msg = dp.getMessage(json);
			console.log("load failed page:", page, " msg:", msg);
			this.changeStatus(STATUS.error, msg);
		}
	};

	// 解决滑动加载模式下，滑动到顶部触发加载时，滑动条位置不变化的问题
	ptype.fixScrollByTop = function() {
	}

	// 触发滚动，防止第一页内容高度不够，没能autoScroll
	ptype.fixScrollPause = function() {
		if (this._options.handler.triggerByScroll) {
			this._$scrollHolder.trigger(evScroll);
		}
	}

	ptype.isAppend = function() {
		return this._options.dataParser.isAppend;
	}

	// 开启滑动滑动
	ptype.enableScroll = function() {
		debuglog("enableScroll:_$scroller", this._$scroller);
		this._disableScroll = false;
		this._$scroller && this._$scroller.trigger(evScroll, true);
	}

	// 暂时关闭滑动 解决一个页面使用同一个scroller滑动，加载效果会冲突的问题
	ptype.disabledScroll = function() {
		debuglog("disabledScroll");
		this._disableScroll = true;
	}

	ptype.changeStatus = function(status, msg) {
		var self = this;
		var options = self._options;
		var msgs = options.msgs;
		var $status = self._$status;
		var $nextPage = self._$nextPage;
		switch (status) {
			case STATUS.loading :
				$status.show().text(msgs.loading);
				$nextPage.hide();
				break;
			case STATUS.allLoaded :
				if (options.handler.showAllLoaded) {
					var smsg = msgs.allLoaded || "";
					if (smsg != "") {
						smsg = smsg.replace("%s", this._itemCount);
						$status.show().text(smsg);
					}
				} else {
					$status.hide();
				}
				$nextPage.hide();
				break;
			case STATUS.noContent :
				if (options.handler.showNoContent) {
					$status.show().text(msgs.noContent);
				} else {
					$status.hide();
				}
				$nextPage.hide();
				break;
			case STATUS.error :
				msg = msg || msgs.unknown;
				$status.show().text(msg);
				options.showWarn(msg);
				break;
			case STATUS.normal :
				if (options.handler.triggerByScroll) {
					$status.show().text(msgs.scrollLoad);
				}
				$nextPage.show();
				$status.hide();
				break;
		}
		var statusFrom = self._status;
		self._status = status;
		// debuglog("changeStatus: from ", statusFrom, " to ",
		// status);
		options.statusChanged.call(this._$el, status, statusFrom, msg);
	}

	// 插件定义
	var old = $.fn[pluginName];
	$.fn[pluginName] = function(options) {
		var args = Array.prototype.slice.call(arguments, 1);
		var returnValFlag = false, returnVal;
		var isOptStr = typeof options == "string";
		var handler = isOptStr ? function() {
			var am = API_METHODS.indexOf(options) != -1;
			var amvm = API_RT_VAL_METHODS.indexOf(options) != -1;
			var method = (am || amvm) && options;
			return function() {
				var $this = $(this);
				var plugin = $this.data(pluginName);
				if (!plugin) {
					//console.error($this, " 插件", pluginName, "未初始化","前调用api",method);
				} else if (method) {
					returnVal = plugin[method].apply(plugin, args);
					return !(amvm && (returnValFlag = true));
				} else {
					console.error("插件没有api ", method);
				}
			}
		}() : function() {
			var $this = $(this);
			var plugin = $this.data(pluginName)
					|| new Plugin($this, options);
			$this.data(pluginName, plugin);
		};
		this.each(handler);
		return returnValFlag ? returnVal : this;
	};
	$.fn[pluginName].noConflict = function() {
		$.fn[pluginName] = old;
		return this;
	};
	$.fn[pluginName].DEFAULTS = DEFAULTS;
});
